import createHttpError from "http-errors";
import { Types } from "mongoose";
import { type ChatMessage, generateReply, generateTitle } from "@/llm/openrouter.js";
import { Conversation, type ConversationRecord } from "@/models/conversation.model.js";
import { Message, type MessageRecord, type MessageRole } from "@/models/message.model.js";
import { type ConversationCursor, encodeConversationCursor } from "./conversation-cursor.js";

const CONTEXT_MESSAGE_LIMIT = 20;
const TITLE_CONTEXT_MESSAGE_LIMIT = 4;
const TITLE_MAX_LENGTH = 60;

export interface ConversationResponse {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface ConversationPageResponse {
  conversations: ConversationResponse[];
  nextCursor: string | null;
}

export interface ConversationDetailResponse {
  conversation: ConversationResponse;
  messages: MessageResponse[];
}

interface ListConversationsInput {
  userId: string;
  limit: number;
  cursor: ConversationCursor | undefined;
  query: string | undefined;
}

interface SendMessageInput {
  userId: string;
  conversationId: string | undefined;
  content: string;
}

const toConversationResponse = ({ _id, title, createdAt, updatedAt }: ConversationRecord): ConversationResponse => ({
  id: _id.toString(),
  title,
  createdAt,
  updatedAt,
});

const toMessageResponse = ({ _id, conversation, role, content, createdAt }: MessageRecord): MessageResponse => ({
  id: _id.toString(),
  conversationId: conversation.toString(),
  role,
  content,
  createdAt,
});

const toChatMessages = (messages: Pick<MessageRecord, "role" | "content">[]): ChatMessage[] =>
  messages.map(({ role, content }) => ({ role, content }));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toTitle = (text: string): string =>
  text
    .replace(/\s+/g, " ")
    .replace(/^["'`\s]+|["'`.\s]+$/g, "")
    .slice(0, TITLE_MAX_LENGTH)
    .trim();

const conversationNotFound = (): Error => createHttpError(404, "Conversation not found");

const findOwnedConversation = async (userId: string, conversationId: string): Promise<ConversationRecord> => {
  const conversation = await Conversation.findOne({ _id: conversationId, user: userId }).lean();
  if (!conversation) throw conversationNotFound();
  return conversation;
};

const loadRecentContext = async (conversationId: Types.ObjectId): Promise<ChatMessage[]> => {
  const messages = await Message.find({ conversation: conversationId })
    .sort({ _id: -1 })
    .limit(CONTEXT_MESSAGE_LIMIT)
    .select("role content")
    .lean();

  return toChatMessages(messages.reverse());
};

export const listConversations = async ({
  userId,
  limit,
  cursor,
  query,
}: ListConversationsInput): Promise<ConversationPageResponse> => {
  const cursorDate = cursor ? new Date(cursor.updatedAt) : undefined;
  const conversations = await Conversation.find({
    user: userId,
    ...(query ? { title: { $regex: escapeRegExp(query), $options: "i" } } : {}),
    ...(cursor && cursorDate
      ? { $or: [{ updatedAt: { $lt: cursorDate } }, { updatedAt: cursorDate, _id: { $lt: cursor.id } }] }
      : {}),
  })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const page = conversations.slice(0, limit);
  const lastConversation = page.at(-1);

  return {
    conversations: page.map(toConversationResponse),
    nextCursor: conversations.length > limit && lastConversation ? encodeConversationCursor(lastConversation) : null,
  };
};

export const getConversation = async (userId: string, conversationId: string): Promise<ConversationDetailResponse> => {
  const conversation = await findOwnedConversation(userId, conversationId);
  const messages = await Message.find({ conversation: conversation._id }).sort({ _id: 1 }).lean();
  return { conversation: toConversationResponse(conversation), messages: messages.map(toMessageResponse) };
};

export const renameConversation = async (
  userId: string,
  conversationId: string,
  title: string,
): Promise<ConversationResponse> => {
  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, user: userId },
    { title },
    { returnDocument: "after", timestamps: false },
  ).lean();
  if (!conversation) throw conversationNotFound();
  return toConversationResponse(conversation);
};

export const deleteConversation = async (userId: string, conversationId: string): Promise<void> => {
  const conversation = await findOwnedConversation(userId, conversationId);
  await Message.deleteMany({ conversation: conversation._id });
  await Conversation.deleteOne({ _id: conversation._id });
};

export const generateConversationTitle = async (
  userId: string,
  conversationId: string,
): Promise<ConversationResponse> => {
  const conversation = await findOwnedConversation(userId, conversationId);
  const messages = await Message.find({ conversation: conversation._id })
    .sort({ _id: 1 })
    .limit(TITLE_CONTEXT_MESSAGE_LIMIT)
    .select("role content")
    .lean();

  const title = messages.length > 0 ? toTitle(await generateTitle(toChatMessages(messages))) : "";
  if (!title) return toConversationResponse(conversation);

  const updated = await Conversation.findOneAndUpdate(
    { _id: conversation._id, user: userId, title: conversation.title },
    { title },
    { returnDocument: "after", timestamps: false },
  ).lean();
  return toConversationResponse(updated ?? (await findOwnedConversation(userId, conversationId)));
};

export const sendMessage = async ({
  userId,
  conversationId,
  content,
}: SendMessageInput): Promise<ConversationDetailResponse> => {
  const existing = conversationId ? await findOwnedConversation(userId, conversationId) : undefined;
  const context = existing ? await loadRecentContext(existing._id) : [];
  const reply = await generateReply([...context, { role: "user", content }]);

  const targetId = existing?._id ?? new Types.ObjectId();
  const messages = await Message.insertMany([
    { conversation: targetId, role: "user", content },
    { conversation: targetId, role: "assistant", content: reply },
  ]);

  const conversation = existing
    ? await Conversation.findOneAndUpdate({ _id: targetId }, { updatedAt: new Date() }, { returnDocument: "after" }).lean()
    : await Conversation.create({ _id: targetId, user: userId, title: toTitle(content) || "New conversation" });
  if (!conversation) {
    await Message.deleteMany({ _id: { $in: messages.map(({ _id }) => _id) } });
    throw conversationNotFound();
  }

  return { conversation: toConversationResponse(conversation), messages: messages.map(toMessageResponse) };
};

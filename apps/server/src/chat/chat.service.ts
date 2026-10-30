import createHttpError from "http-errors";
import { Types } from "mongoose";
import { type ChatMessage, generateReply } from "@/llm/openrouter.js";
import { Conversation, type ConversationRecord } from "@/models/conversation.model.js";
import { Message, type MessageRecord, type MessageRole } from "@/models/message.model.js";

const CONTEXT_MESSAGE_LIMIT = 20;
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

export interface SendMessageResponse {
  conversationId: string;
  messages: MessageResponse[];
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

const findOwnedConversationId = async (userId: string, conversationId: string): Promise<Types.ObjectId> => {
  const conversation = await Conversation.exists({ _id: conversationId, user: userId });
  if (!conversation) throw createHttpError(404, "Conversation not found");
  return conversation._id;
};

const loadRecentContext = async (conversationId: Types.ObjectId): Promise<ChatMessage[]> => {
  const messages = await Message.find({ conversation: conversationId })
    .sort({ _id: -1 })
    .limit(CONTEXT_MESSAGE_LIMIT)
    .select("role content")
    .lean();

  return messages.reverse().map(({ role, content }) => ({ role, content }));
};

export const listConversations = async (userId: string): Promise<ConversationResponse[]> => {
  const conversations = await Conversation.find({ user: userId }).sort({ updatedAt: -1 }).lean();
  return conversations.map(toConversationResponse);
};

export const listMessages = async (userId: string, conversationId: string): Promise<MessageResponse[]> => {
  const ownedId = await findOwnedConversationId(userId, conversationId);
  const messages = await Message.find({ conversation: ownedId }).sort({ _id: 1 }).lean();
  return messages.map(toMessageResponse);
};

export const sendMessage = async ({ userId, conversationId, content }: SendMessageInput): Promise<SendMessageResponse> => {
  const existingId = conversationId ? await findOwnedConversationId(userId, conversationId) : undefined;
  const context = existingId ? await loadRecentContext(existingId) : [];
  const reply = await generateReply([...context, { role: "user", content }]);

  const targetId = existingId ?? new Types.ObjectId();
  const messages = await Message.insertMany([
    { conversation: targetId, role: "user", content },
    { conversation: targetId, role: "assistant", content: reply },
  ]);

  if (existingId) {
    await Conversation.updateOne({ _id: existingId }, { updatedAt: new Date() });
  } else {
    await Conversation.create({ _id: targetId, user: userId, title: content.slice(0, TITLE_MAX_LENGTH) });
  }

  return { conversationId: targetId.toString(), messages: messages.map(toMessageResponse) };
};

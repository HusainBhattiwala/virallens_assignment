import createHttpError from "http-errors";
import type { Types } from "mongoose";
import { type ChatMessage, generateReply } from "@/llm/openrouter.js";
import { Conversation } from "@/models/conversation.model.js";
import { Message, type MessageRole } from "@/models/message.model.js";

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

interface ConversationRecord {
  _id: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRecord {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
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

const findConversation = async (userId: string, conversationId: string) => {
  const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
  if (!conversation) throw createHttpError(404, "Conversation not found");
  return conversation;
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
  const conversation = await findConversation(userId, conversationId);
  const messages = await Message.find({ conversation: conversation._id }).sort({ _id: 1 }).lean();
  return messages.map(toMessageResponse);
};

export const sendMessage = async ({ userId, conversationId, content }: SendMessageInput): Promise<SendMessageResponse> => {
  const existing = conversationId ? await findConversation(userId, conversationId) : undefined;
  const context = existing ? await loadRecentContext(existing._id) : [];
  const reply = await generateReply([...context, { role: "user", content }]);

  const conversation =
    existing ?? (await Conversation.create({ user: userId, title: content.slice(0, TITLE_MAX_LENGTH) }));

  const messages = await Message.insertMany([
    { conversation: conversation._id, role: "user", content },
    { conversation: conversation._id, role: "assistant", content: reply },
  ]);

  if (existing) await existing.updateOne({ updatedAt: new Date() });

  return { conversationId: conversation._id.toString(), messages: messages.map(toMessageResponse) };
};

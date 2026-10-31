import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";
import { conversationCursorSchema } from "./conversation-cursor.js";

const objectId = (resource: string) =>
  z.stringFormat("objectid", (value) => isObjectIdOrHexString(value), {
    error: `Invalid ${resource} id`,
  });

const messageContent = z.string().trim().min(1).max(4000);

export const sendMessageSchema = z.object({
  message: messageContent,
  conversationId: objectId("conversation").optional(),
});

export const editMessageSchema = z.object({
  message: messageContent,
});

export const conversationParamsSchema = z.object({
  conversationId: objectId("conversation"),
});

export const messageParamsSchema = conversationParamsSchema.extend({
  messageId: objectId("message"),
});

export const listConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: conversationCursorSchema.optional(),
  q: z.string().trim().max(100).optional(),
});

export const renameConversationSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";
import { conversationCursorSchema } from "./conversation-cursor.js";

const objectId = z.stringFormat("objectid", (value) => isObjectIdOrHexString(value), {
  error: "Invalid conversation id",
});

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: objectId.optional(),
});

export const conversationParamsSchema = z.object({
  conversationId: objectId,
});

export const listConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: conversationCursorSchema.optional(),
  q: z.string().trim().max(100).optional(),
});

export const renameConversationSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

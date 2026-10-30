import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";

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

import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";
import type { ConversationRecord } from "@/models/conversation.model.js";

const cursorPositionSchema = z.object({
  updatedAt: z.iso.datetime(),
  id: z.string().refine((value) => isObjectIdOrHexString(value)),
});

export const conversationCursorSchema = z
  .string()
  .transform((value, context): unknown => {
    try {
      return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    } catch {
      context.addIssue({ code: "custom", message: "Invalid cursor" });
      return z.NEVER;
    }
  })
  .pipe(cursorPositionSchema);

export type ConversationCursor = z.infer<typeof conversationCursorSchema>;

export const encodeConversationCursor = ({ _id, updatedAt }: ConversationRecord): string =>
  Buffer.from(JSON.stringify({ updatedAt: updatedAt.toISOString(), id: _id.toString() })).toString("base64url");

import { type InferSchemaType, model, Schema, type Types } from "mongoose";

const conversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

conversationSchema.index({ user: 1, updatedAt: -1 });

export type ConversationRecord = InferSchemaType<typeof conversationSchema> & { _id: Types.ObjectId };

export const Conversation = model("Conversation", conversationSchema);

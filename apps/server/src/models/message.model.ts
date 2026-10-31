import { type InferSchemaType, model, Schema, type Types } from "mongoose";

export const MESSAGE_ROLES = ["user", "assistant"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    seq: { type: Number, required: true, min: 0 },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversation: 1, seq: 1 }, { unique: true });

export type MessageRecord = InferSchemaType<typeof messageSchema> & { _id: Types.ObjectId };

export const Message = model("Message", messageSchema);

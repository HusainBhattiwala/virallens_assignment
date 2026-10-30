import { Router } from "express";
import { getUserId, requireAuth } from "@/auth/session.js";
import { conversationParamsSchema, sendMessageSchema } from "./chat.schema.js";
import { listConversations, listMessages, sendMessage } from "./chat.service.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post("/send", async (req, res) => {
  const { message, conversationId } = sendMessageSchema.parse(req.body);
  res.status(201).json(await sendMessage({ userId: getUserId(req), conversationId, content: message }));
});

chatRouter.get("/history", async (req, res) => {
  res.json({ conversations: await listConversations(getUserId(req)) });
});

chatRouter.get("/history/:conversationId", async (req, res) => {
  const { conversationId } = conversationParamsSchema.parse(req.params);
  res.json({ messages: await listMessages(getUserId(req), conversationId) });
});

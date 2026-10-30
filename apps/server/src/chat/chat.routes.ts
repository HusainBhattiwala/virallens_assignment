import { Router } from "express";
import { getUserId, requireAuth } from "@/auth/session.js";
import {
  conversationParamsSchema,
  listConversationsQuerySchema,
  renameConversationSchema,
  sendMessageSchema,
} from "./chat.schema.js";
import {
  deleteConversation,
  generateConversationTitle,
  getConversation,
  listConversations,
  renameConversation,
  sendMessage,
} from "./chat.service.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post("/send", async (req, res) => {
  const { message, conversationId } = sendMessageSchema.parse(req.body);
  res.status(201).json(await sendMessage({ userId: getUserId(req), conversationId, content: message }));
});

chatRouter.get("/history", async (req, res) => {
  const { limit, cursor, q } = listConversationsQuerySchema.parse(req.query);
  res.json(await listConversations({ userId: getUserId(req), limit, cursor, query: q }));
});

chatRouter.get("/history/:conversationId", async (req, res) => {
  const { conversationId } = conversationParamsSchema.parse(req.params);
  res.json(await getConversation(getUserId(req), conversationId));
});

chatRouter.patch("/history/:conversationId", async (req, res) => {
  const { conversationId } = conversationParamsSchema.parse(req.params);
  const { title } = renameConversationSchema.parse(req.body);
  res.json({ conversation: await renameConversation(getUserId(req), conversationId, title) });
});

chatRouter.delete("/history/:conversationId", async (req, res) => {
  const { conversationId } = conversationParamsSchema.parse(req.params);
  await deleteConversation(getUserId(req), conversationId);
  res.status(204).end();
});

chatRouter.post("/history/:conversationId/title", async (req, res) => {
  const { conversationId } = conversationParamsSchema.parse(req.params);
  res.json({ conversation: await generateConversationTitle(getUserId(req), conversationId) });
});

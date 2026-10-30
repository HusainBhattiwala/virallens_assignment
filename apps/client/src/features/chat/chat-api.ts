import { z } from "zod"
import { apiRequest } from "@/lib/api"

const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
})

const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const conversationsResponseSchema = z.object({ conversations: z.array(conversationSchema) })
const messagesResponseSchema = z.object({ messages: z.array(messageSchema) })
const sendMessageResponseSchema = z.object({
  conversationId: z.string(),
  messages: z.array(messageSchema),
})

export type Message = z.infer<typeof messageSchema>
export type MessageRole = Message["role"]
export type Conversation = z.infer<typeof conversationSchema>
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>

export interface SendMessageInput {
  message: string
  conversationId: string | undefined
}

export const fetchConversations = async (): Promise<Conversation[]> => {
  const { conversations } = await apiRequest("/chat/history", conversationsResponseSchema)
  return conversations
}

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { messages } = await apiRequest(
    `/chat/history/${encodeURIComponent(conversationId)}`,
    messagesResponseSchema
  )
  return messages
}

export const sendMessage = (input: SendMessageInput): Promise<SendMessageResponse> =>
  apiRequest("/chat/send", sendMessageResponseSchema, { method: "POST", body: input })

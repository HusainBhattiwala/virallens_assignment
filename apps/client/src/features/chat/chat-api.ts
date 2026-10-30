import { z } from "zod"
import { apiCommand, apiRequest } from "@/lib/api"

export const CONVERSATION_PAGE_SIZE = 20

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

const conversationPageSchema = z.object({
  conversations: z.array(conversationSchema),
  nextCursor: z.string().nullable(),
})

const conversationDetailSchema = z.object({
  conversation: conversationSchema,
  messages: z.array(messageSchema),
})

const conversationResponseSchema = z.object({
  conversation: conversationSchema,
})

export type Message = z.infer<typeof messageSchema>
export type MessageRole = Message["role"]
export type Conversation = z.infer<typeof conversationSchema>
export type ConversationPage = z.infer<typeof conversationPageSchema>
export type ConversationDetail = z.infer<typeof conversationDetailSchema>

export interface SendMessageInput {
  message: string
  conversationId: string | undefined
}

export interface ConversationPageQuery {
  search: string
  cursor: string | null
}

const conversationPath = (conversationId: string): string =>
  `/chat/history/${encodeURIComponent(conversationId)}`

export const fetchConversationPage = ({
  search,
  cursor,
}: ConversationPageQuery): Promise<ConversationPage> => {
  const params = new URLSearchParams({ limit: String(CONVERSATION_PAGE_SIZE) })
  if (search) params.set("q", search)
  if (cursor) params.set("cursor", cursor)
  return apiRequest(
    `/chat/history?${params.toString()}`,
    conversationPageSchema
  )
}

export const fetchConversation = (
  conversationId: string
): Promise<ConversationDetail> =>
  apiRequest(conversationPath(conversationId), conversationDetailSchema)

export const sendMessage = (
  input: SendMessageInput
): Promise<ConversationDetail> =>
  apiRequest("/chat/send", conversationDetailSchema, {
    method: "POST",
    body: input,
  })

export const renameConversation = async (
  conversationId: string,
  title: string
): Promise<Conversation> => {
  const { conversation } = await apiRequest(
    conversationPath(conversationId),
    conversationResponseSchema,
    {
      method: "PATCH",
      body: { title },
    }
  )
  return conversation
}

export const deleteConversation = (conversationId: string): Promise<void> =>
  apiCommand(conversationPath(conversationId), { method: "DELETE" })

export const generateConversationTitle = async (
  conversationId: string
): Promise<Conversation> => {
  const { conversation } = await apiRequest(
    `${conversationPath(conversationId)}/title`,
    conversationResponseSchema,
    {
      method: "POST",
    }
  )
  return conversation
}

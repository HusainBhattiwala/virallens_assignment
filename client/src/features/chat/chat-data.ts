import useSWR from "swr"
import type { ApiError } from "@/lib/api"
import { type Conversation, fetchConversations, fetchMessages, type Message } from "./chat-api"

export const CONVERSATIONS_KEY = "conversations"

export const messagesKey = (conversationId: string) => ["messages", conversationId] as const

export const useConversations = () => useSWR<Conversation[], ApiError>(CONVERSATIONS_KEY, fetchConversations)

export const useMessages = (conversationId: string | undefined) =>
  useSWR<Message[], ApiError, ReturnType<typeof messagesKey> | null>(
    conversationId ? messagesKey(conversationId) : null,
    ([, id]: ReturnType<typeof messagesKey>) => fetchMessages(id)
  )

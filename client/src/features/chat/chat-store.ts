import { mutate } from "swr"
import { create } from "zustand"
import { getErrorMessage, isUnauthorized } from "@/lib/api"
import { useAuthStore } from "@/features/auth/auth-store"
import { type Message, sendMessage } from "./chat-api"
import { CONVERSATIONS_KEY, messagesKey } from "./chat-data"

export const NEW_CONVERSATION_KEY = "new"

export type PendingStatus = "sending" | "failed"

export interface PendingMessage {
  content: string
  status: PendingStatus
  error: string | null
}

interface SendMessageParams {
  conversationId: string | undefined
  content: string
  onConversationCreated: (conversationId: string) => void
}

interface ChatState {
  pending: Partial<Record<string, PendingMessage>>
  sendMessage: (params: SendMessageParams) => Promise<void>
  discardPending: (conversationId: string | undefined) => void
}

const toPendingKey = (conversationId: string | undefined): string => conversationId ?? NEW_CONVERSATION_KEY

export const useChatStore = create<ChatState>()((set) => {
  const setPending = (key: string, message: PendingMessage | undefined): void => {
    set((state) => ({ pending: { ...state.pending, [key]: message } }))
  }

  return {
    pending: {},

    sendMessage: async ({ conversationId, content, onConversationCreated }) => {
      const key = toPendingKey(conversationId)
      setPending(key, { content, status: "sending", error: null })

      try {
        const result = await sendMessage({ message: content, conversationId })
        await mutate<Message[]>(
          messagesKey(result.conversationId),
          (current = []) => [...current, ...result.messages],
          { revalidate: false }
        )
        void mutate(CONVERSATIONS_KEY)

        if (!conversationId) onConversationCreated(result.conversationId)
        setPending(key, undefined)
      } catch (error) {
        if (isUnauthorized(error)) {
          setPending(key, undefined)
          useAuthStore.getState().expireSession()
          return
        }
        setPending(key, { content, status: "failed", error: getErrorMessage(error) })
      }
    },

    discardPending: (conversationId) => {
      setPending(toPendingKey(conversationId), undefined)
    },
  }
})

useAuthStore.subscribe((state, previous) => {
  if (previous.user && !state.user) useChatStore.setState({ pending: {} })
})

export const usePendingMessage = (conversationId: string | undefined): PendingMessage | undefined =>
  useChatStore((state) => state.pending[toPendingKey(conversationId)])

import { create } from "zustand"
import {
  endSessionIfUnauthorized,
  useAuthStore,
} from "@/features/auth/auth-store"
import { getErrorMessage } from "@/lib/api"
import { editMessage, sendMessage } from "./chat-api"
import {
  refreshConversationList,
  replaceConversationDetail,
  revalidateConversation,
  saveConversationDetail,
} from "./chat-data"
import { requestGeneratedTitle } from "./conversation-actions"

export const NEW_CONVERSATION_KEY = "new"

export type PendingStatus = "sending" | "failed"

export interface PendingMessage {
  content: string
  replacesMessageId: string | null
  status: PendingStatus
  error: string | null
}

type PendingDraft = Pick<PendingMessage, "content" | "replacesMessageId">

interface SendMessageParams {
  conversationId: string | undefined
  content: string
  onConversationCreated: (conversationId: string) => void
}

interface EditMessageParams {
  conversationId: string
  messageId: string
  content: string
}

interface ChatState {
  pending: Partial<Record<string, PendingMessage>>
  sendMessage: (params: SendMessageParams) => Promise<void>
  editMessage: (params: EditMessageParams) => Promise<void>
  discardPending: (conversationId: string | undefined) => void
}

const toPendingKey = (conversationId: string | undefined): string =>
  conversationId ?? NEW_CONVERSATION_KEY

export const useChatStore = create<ChatState>()((set) => {
  const setPending = (
    key: string,
    message: PendingMessage | undefined
  ): void => {
    set((state) => ({ pending: { ...state.pending, [key]: message } }))
  }

  const submit = async <T>(
    key: string,
    draft: PendingDraft,
    request: () => Promise<T>,
    onSuccess: (result: T) => void
  ): Promise<void> => {
    const userId = useAuthStore.getState().user?.id
    const isSameUser = () => useAuthStore.getState().user?.id === userId

    setPending(key, { ...draft, status: "sending", error: null })
    try {
      const result = await request()
      if (!isSameUser()) return
      onSuccess(result)
      setPending(key, undefined)
    } catch (error) {
      if (!isSameUser() || endSessionIfUnauthorized(error)) return
      setPending(key, {
        ...draft,
        status: "failed",
        error: getErrorMessage(error),
      })
      if (key !== NEW_CONVERSATION_KEY) void revalidateConversation(key)
    }
  }

  return {
    pending: {},

    sendMessage: ({ conversationId, content, onConversationCreated }) =>
      submit(
        toPendingKey(conversationId),
        { content, replacesMessageId: null },
        () => sendMessage({ message: content, conversationId }),
        (result) => {
          void saveConversationDetail(result)
          void refreshConversationList()

          if (!conversationId) {
            onConversationCreated(result.conversation.id)
            void requestGeneratedTitle(result.conversation.id)
          }
        }
      ),

    editMessage: ({ conversationId, messageId, content }) =>
      submit(
        conversationId,
        { content, replacesMessageId: messageId },
        () => editMessage({ conversationId, messageId, message: content }),
        (result) => {
          void replaceConversationDetail(result)
          void refreshConversationList()
        }
      ),

    discardPending: (conversationId) => {
      setPending(toPendingKey(conversationId), undefined)
    },
  }
})

useAuthStore.subscribe((state, previous) => {
  if (previous.user && !state.user) useChatStore.setState({ pending: {} })
})

export const usePendingMessage = (
  conversationId: string | undefined
): PendingMessage | undefined =>
  useChatStore((state) => state.pending[toPendingKey(conversationId)])

import { endSessionIfUnauthorized } from "@/features/auth/auth-store"
import {
  deleteConversation,
  generateConversationTitle,
  renameConversation,
} from "./chat-api"
import {
  forgetConversation,
  refreshConversationList,
  saveConversation,
} from "./chat-data"

export const renameConversationTitle = async (
  conversationId: string,
  title: string
): Promise<void> => {
  await saveConversation(await renameConversation(conversationId, title))
  void refreshConversationList()
}

export const removeConversation = async (
  conversationId: string
): Promise<void> => {
  await deleteConversation(conversationId)
  await forgetConversation(conversationId)
  void refreshConversationList()
}

export const requestGeneratedTitle = async (
  conversationId: string
): Promise<void> => {
  try {
    await saveConversation(await generateConversationTitle(conversationId))
    void refreshConversationList()
  } catch (error) {
    endSessionIfUnauthorized(error)
  }
}

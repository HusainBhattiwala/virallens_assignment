import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/features/auth/auth-store"
import { ApiError } from "@/lib/api"
import { type ConversationDetail, sendMessage } from "./chat-api"
import { saveConversationDetail } from "./chat-data"
import { NEW_CONVERSATION_KEY, useChatStore } from "./chat-store"

vi.mock("./chat-api")
vi.mock("./chat-data")
vi.mock("./conversation-actions")

const DETAIL: ConversationDetail = {
  conversation: {
    id: "c1",
    title: "Where is my order?",
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
  },
  messages: [],
}

const send = (onConversationCreated = vi.fn()) =>
  useChatStore.getState().sendMessage({
    conversationId: undefined,
    content: "Where is my order?",
    onConversationCreated,
  })

const pendingMessage = () =>
  useChatStore.getState().pending[NEW_CONVERSATION_KEY]

beforeEach(() => {
  useAuthStore.setState({
    user: { id: "u1", email: "jane@example.com" },
    status: "authenticated",
  })
})

afterEach(() => {
  useChatStore.setState(useChatStore.getInitialState(), true)
  useAuthStore.setState(useAuthStore.getInitialState(), true)
})

describe("chat store sendMessage", () => {
  it("saves the reply and opens the new conversation", async () => {
    vi.mocked(sendMessage).mockResolvedValue(DETAIL)
    const onConversationCreated = vi.fn()

    await send(onConversationCreated)

    expect(saveConversationDetail).toHaveBeenCalledWith(DETAIL)
    expect(onConversationCreated).toHaveBeenCalledWith("c1")
    expect(pendingMessage()).toBeUndefined()
  })

  it("keeps a failed message and its error so the user can retry", async () => {
    vi.mocked(sendMessage).mockRejectedValue(
      new ApiError(503, "The assistant is busy right now")
    )

    await send()

    expect(pendingMessage()).toEqual({
      content: "Where is my order?",
      replacesMessageId: null,
      status: "failed",
      error: "The assistant is busy right now",
    })
  })

  it("ends the session instead of showing an error when the server returns 401", async () => {
    vi.mocked(sendMessage).mockRejectedValue(
      new ApiError(401, "Not authenticated")
    )

    await send()

    expect(useAuthStore.getState().status).toBe("guest")
    expect(useChatStore.getState().pending).toEqual({})
  })

  it("drops a reply that arrives after a different user has logged in", async () => {
    let resolveReply: (detail: ConversationDetail) => void = () => undefined
    vi.mocked(sendMessage).mockReturnValue(
      new Promise((resolve) => {
        resolveReply = resolve
      })
    )

    const sending = send()
    useAuthStore.setState({ user: { id: "u2", email: "sam@example.com" } })
    resolveReply(DETAIL)
    await sending

    expect(saveConversationDetail).not.toHaveBeenCalled()
  })
})

import { useCallback, useEffect } from "react"
import useSWR, { type Arguments, mutate } from "swr"
import useSWRInfinite, { unstable_serialize } from "swr/infinite"
import type { ApiError } from "@/lib/api"
import {
  type Conversation,
  type ConversationDetail,
  type ConversationPage,
  fetchConversation,
  fetchConversationPage,
} from "./chat-api"

const CONVERSATION_PAGE_KEY = "conversations"

type ConversationPageKey = readonly [
  typeof CONVERSATION_PAGE_KEY,
  string,
  string | null,
]

type ConversationKey = readonly ["conversation", string]

const getConversationPageKey =
  (search: string) =>
  (
    pageIndex: number,
    previousPage: ConversationPage | null
  ): ConversationPageKey | null => {
    if (pageIndex === 0) return [CONVERSATION_PAGE_KEY, search, null]
    return previousPage?.nextCursor
      ? [CONVERSATION_PAGE_KEY, search, previousPage.nextCursor]
      : null
  }

const conversationKey = (conversationId: string): ConversationKey => [
  "conversation",
  conversationId,
]

const isConversationPageKey = (key: Arguments): boolean =>
  Array.isArray(key) && key[0] === CONVERSATION_PAGE_KEY

const mountedLists = new Map<string, () => Promise<unknown>>()

const cachedSearches = new Set<string>()

const uniqueById = (conversations: Conversation[]): Conversation[] => {
  const seen = new Set<string>()
  return conversations.filter((conversation) => {
    if (seen.has(conversation.id)) return false
    seen.add(conversation.id)
    return true
  })
}

export const useConversationList = (search: string) => {
  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate: revalidate,
  } = useSWRInfinite<ConversationPage, ApiError>(
    getConversationPageKey(search),
    ([, query, cursor]: ConversationPageKey) =>
      fetchConversationPage({ search: query, cursor }),
    { keepPreviousData: true, revalidateFirstPage: false }
  )

  useEffect(() => {
    cachedSearches.add(search)
    mountedLists.set(search, revalidate)
    return () => {
      mountedLists.delete(search)
    }
  }, [search, revalidate])

  const loadMore = useCallback(() => {
    void setSize((currentSize) => currentSize + 1)
  }, [setSize])

  const refresh = useCallback(() => {
    void revalidate()
  }, [revalidate])

  return {
    conversations: uniqueById(
      data?.flatMap((page) => page.conversations) ?? []
    ),
    error,
    isLoading: isLoading && data === undefined,
    isLoadingMore: data !== undefined && data.length < size,
    isRefreshing: isValidating,
    hasMore: Boolean(data?.at(-1)?.nextCursor),
    loadMore,
    refresh,
  }
}

export const useConversation = (conversationId: string | undefined) =>
  useSWR<ConversationDetail, ApiError, ConversationKey | null>(
    conversationId ? conversationKey(conversationId) : null,
    ([, id]: ConversationKey) => fetchConversation(id)
  )

const forgetConversationList = async (search: string): Promise<void> => {
  cachedSearches.delete(search)
  await mutate(unstable_serialize(getConversationPageKey(search)), undefined, {
    revalidate: false,
  })
}

export const refreshConversationList = async (): Promise<void> => {
  await mutate(isConversationPageKey, undefined, { revalidate: false })
  const inactiveSearches = [...cachedSearches].filter(
    (search) => !mountedLists.has(search)
  )
  await Promise.all([
    ...inactiveSearches.map(forgetConversationList),
    ...Array.from(mountedLists.values(), (revalidate) => revalidate()),
  ])
}

export const saveConversationDetail = async ({
  conversation,
  messages,
}: ConversationDetail): Promise<void> => {
  await mutate<ConversationDetail>(
    conversationKey(conversation.id),
    (current) => ({
      conversation,
      messages: [...(current?.messages ?? []), ...messages],
    }),
    { revalidate: false }
  )
}

export const revalidateConversation = async (
  conversationId: string
): Promise<void> => {
  await mutate(conversationKey(conversationId))
}

export const replaceConversationDetail = async (
  detail: ConversationDetail
): Promise<void> => {
  await mutate(conversationKey(detail.conversation.id), detail, {
    revalidate: false,
  })
}

export const saveConversation = async (
  conversation: Conversation
): Promise<void> => {
  await mutate<ConversationDetail>(
    conversationKey(conversation.id),
    (current) => (current ? { ...current, conversation } : current),
    { revalidate: false }
  )
}

export const forgetConversation = async (
  conversationId: string
): Promise<void> => {
  await mutate(conversationKey(conversationId), undefined, {
    revalidate: false,
  })
}

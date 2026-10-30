import { MessageSquareOff } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api"
import { useConversations, useMessages } from "./chat-data"
import {
  NEW_CONVERSATION_KEY,
  useChatStore,
  usePendingMessage,
} from "./chat-store"
import { Composer } from "./composer"
import { EmptyConversation } from "./empty-conversation"
import { MessageList } from "./message-list"

export function ChatPage() {
  const { conversationId } = useParams<"conversationId">()
  return (
    <ConversationView
      key={conversationId ?? NEW_CONVERSATION_KEY}
      conversationId={conversationId}
    />
  )
}

interface ConversationViewProps {
  conversationId: string | undefined
}

function ConversationView({ conversationId }: ConversationViewProps) {
  const navigate = useNavigate()
  const { data: conversations } = useConversations()
  const {
    data: messages,
    error,
    isLoading,
    mutate,
  } = useMessages(conversationId)
  const pending = usePendingMessage(conversationId)
  const sendMessage = useChatStore((state) => state.sendMessage)

  const title = conversationId
    ? (conversations?.find((conversation) => conversation.id === conversationId)
        ?.title ?? "Conversation")
    : "New conversation"

  const send = (content: string) => {
    void sendMessage({
      conversationId,
      content,
      onConversationCreated: (createdId) => {
        void navigate(`/chat/${createdId}`, { replace: true })
      },
    })
  }

  const renderBody = () => {
    if (!conversationId) {
      return pending ? (
        <MessageList messages={[]} pending={pending} onRetry={send} />
      ) : (
        <EmptyConversation onPick={send} />
      )
    }
    if (isLoading) return <MessagesSkeleton />
    if (error) {
      return (
        <ConversationUnavailable
          message={getErrorMessage(error)}
          onRetry={() => void mutate()}
        />
      )
    }
    return (
      <MessageList messages={messages ?? []} pending={pending} onRetry={send} />
    )
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:px-5">
        <SidebarTrigger className="-ml-1" />
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{renderBody()}</div>
      <Composer isSending={pending?.status === "sending"} onSend={send} />
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8 sm:px-6"
      role="status"
    >
      <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
      <div className="flex gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-20 w-3/5 rounded-2xl" />
      </div>
      <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
      <span className="sr-only">Loading conversation</span>
    </div>
  )
}

interface ConversationUnavailableProps {
  message: string
  onRetry: () => void
}

function ConversationUnavailable({
  message,
  onRetry,
}: ConversationUnavailableProps) {
  return (
    <Empty className="h-full border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquareOff />
        </EmptyMedia>
        <EmptyTitle>This conversation couldn't be opened</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
        <Button render={<Link to="/chat" />} nativeButton={false}>
          Start a new conversation
        </Button>
      </EmptyContent>
    </Empty>
  )
}

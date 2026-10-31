import { MessageSquareOff, SquarePen } from "lucide-react"
import { useState } from "react"
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
import { useSidebar } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getErrorMessage } from "@/lib/api"
import { useConversation } from "./chat-data"
import {
  NEW_CONVERSATION_KEY,
  type PendingMessage,
  useChatStore,
  usePendingMessage,
} from "./chat-store"
import { Composer } from "./composer"
import { EmptyConversation } from "./empty-conversation"
import { MessageList } from "./message-list"
import { SidebarToggle } from "./sidebar-toggle"

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
  const {
    data: detail,
    error,
    isLoading,
    mutate,
  } = useConversation(conversationId)
  const pending = usePendingMessage(conversationId)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const editMessage = useChatStore((state) => state.editMessage)
  const discardPending = useChatStore((state) => state.discardPending)
  const [editingId, setEditingId] = useState<string | null>(null)
  const isEditing = detail?.messages.some(({ id }) => id === editingId) ?? false
  const hasUnresolvedEdit =
    pending?.status === "failed" && pending.replacesMessageId !== null

  const title = conversationId
    ? (detail?.conversation.title ?? "Conversation")
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

  const retry = ({ content, replacesMessageId }: PendingMessage) => {
    if (conversationId && replacesMessageId) {
      void editMessage({
        conversationId,
        messageId: replacesMessageId,
        content,
      })
      return
    }
    send(content)
  }

  const discard = () => {
    discardPending(conversationId)
  }

  const renderBody = () => {
    if (!conversationId) {
      return pending ? (
        <MessageList
          messages={[]}
          pending={pending}
          onRetry={retry}
          onDiscard={discard}
        />
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
      <MessageList
        messages={detail?.messages ?? []}
        pending={pending}
        onRetry={retry}
        onDiscard={discard}
        editing={{
          messageId: editingId,
          onChange: setEditingId,
          onSubmit: (messageId, content) => {
            void editMessage({ conversationId, messageId, content })
          },
        }}
      />
    )
  }

  return (
    <div className="flex h-svh flex-col">
      <ChatHeader title={title} />
      <div className="min-h-0 flex-1 overflow-y-auto">{renderBody()}</div>
      <Composer
        isSending={pending?.status === "sending"}
        isBlocked={isEditing || hasUnresolvedEdit}
        onSend={send}
      />
    </div>
  )
}

interface ChatHeaderProps {
  title: string
}

function ChatHeader({ title }: ChatHeaderProps) {
  const { isMobile, state } = useSidebar()
  const showSidebarControls = isMobile || state === "collapsed"

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 px-3 sm:px-4">
      {showSidebarControls ? (
        <>
          <SidebarToggle action="open" />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New conversation"
                  render={<Link to="/chat" />}
                  nativeButton={false}
                />
              }
            >
              <SquarePen />
            </TooltipTrigger>
            <TooltipContent side="bottom">New conversation</TooltipContent>
          </Tooltip>
        </>
      ) : null}
      <h1 className="truncate px-2 text-sm font-medium text-muted-foreground">
        {title}
      </h1>
    </header>
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

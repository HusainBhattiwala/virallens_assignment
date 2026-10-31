import { Pencil, RotateCcw, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatTime } from "@/lib/format"
import type { Message } from "./chat-api"
import type { PendingMessage } from "./chat-store"
import { MessageBubble } from "./message-bubble"
import { MessageEditor } from "./message-editor"
import { TypingIndicator } from "./typing-indicator"

interface MessageEditing {
  messageId: string | null
  onChange: (messageId: string | null) => void
  onSubmit: (messageId: string, content: string) => void
}

interface MessageListProps {
  messages: Message[]
  pending: PendingMessage | undefined
  onRetry: (pending: PendingMessage) => void
  onDiscard: () => void
  editing?: MessageEditing
}

export function MessageList({
  messages,
  pending,
  onRetry,
  onDiscard,
  editing,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const [returnFocusId, setReturnFocusId] = useState<string | null>(null)
  const replacedIndex = pending?.replacesMessageId
    ? messages.findIndex(({ id }) => id === pending.replacesMessageId)
    : -1
  const visibleMessages =
    replacedIndex === -1 ? messages : messages.slice(0, replacedIndex)
  const canRetry = !pending?.replacesMessageId || replacedIndex !== -1
  const pendingStatus = pending?.status
  const activeEditing = pending ? undefined : editing

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [visibleMessages.length, pendingStatus])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <ol className="flex flex-col gap-7" aria-label="Conversation">
        {visibleMessages.map((message) => (
          <li key={message.id} className="group">
            {activeEditing?.messageId === message.id ? (
              <MessageEditor
                initialContent={message.content}
                onCancel={() => {
                  activeEditing.onChange(null)
                  setReturnFocusId(message.id)
                }}
                onSubmit={(content) => {
                  activeEditing.onChange(null)
                  activeEditing.onSubmit(message.id, content)
                }}
              />
            ) : (
              <MessageBubble
                role={message.role}
                content={message.content}
                meta={
                  <MessageMeta
                    createdAt={message.createdAt}
                    hasFocus={returnFocusId === message.id}
                    onBlur={() => {
                      setReturnFocusId(null)
                    }}
                    onEdit={
                      activeEditing && message.role === "user"
                        ? () => {
                            activeEditing.onChange(message.id)
                          }
                        : undefined
                    }
                  />
                }
              />
            )}
          </li>
        ))}
        {pending ? (
          <li>
            <MessageBubble
              role="user"
              content={pending.content}
              isFailed={pending.status === "failed"}
              meta={
                pending.status === "failed" ? (
                  <div
                    className="flex items-center gap-2 px-1 text-xs text-destructive"
                    role="alert"
                  >
                    <span>Not sent. {pending.error}</span>
                    {canRetry ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          onRetry(pending)
                        }}
                      >
                        <RotateCcw data-icon="inline-start" />
                        Retry
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="xs" onClick={onDiscard}>
                      <X data-icon="inline-start" />
                      Discard
                    </Button>
                  </div>
                ) : (
                  <span className="px-1 text-xs text-muted-foreground">
                    Sending
                  </span>
                )
              }
            />
          </li>
        ) : null}
        {pendingStatus === "sending" ? (
          <li>
            <TypingIndicator />
          </li>
        ) : null}
      </ol>
      <div ref={endRef} />
    </div>
  )
}

interface MessageMetaProps {
  createdAt: string
  hasFocus: boolean
  onBlur: () => void
  onEdit: (() => void) | undefined
}

function MessageMeta({
  createdAt,
  hasFocus,
  onBlur,
  onEdit,
}: MessageMetaProps) {
  return (
    <div className="flex items-center gap-1 px-1">
      {onEdit ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Edit message"
                autoFocus={hasFocus}
                onBlur={onBlur}
                className="text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
                onClick={onEdit}
              />
            }
          >
            <Pencil />
          </TooltipTrigger>
          <TooltipContent>Edit message</TooltipContent>
        </Tooltip>
      ) : null}
      <time dateTime={createdAt} className="text-xs text-muted-foreground">
        {formatTime(createdAt)}
      </time>
    </div>
  )
}

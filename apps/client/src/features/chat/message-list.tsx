import { RotateCcw } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format"
import type { Message } from "./chat-api"
import type { PendingMessage } from "./chat-store"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"

interface MessageListProps {
  messages: Message[]
  pending: PendingMessage | undefined
  onRetry: (content: string) => void
}

export function MessageList({ messages, pending, onRetry }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const pendingStatus = pending?.status

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, pendingStatus])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <ol className="flex flex-col gap-7" aria-label="Conversation">
        {messages.map((message) => (
          <li key={message.id}>
            <MessageBubble
              role={message.role}
              content={message.content}
              meta={
                <time
                  dateTime={message.createdAt}
                  className="px-1 text-xs text-muted-foreground"
                >
                  {formatTime(message.createdAt)}
                </time>
              }
            />
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
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        onRetry(pending.content)
                      }}
                    >
                      <RotateCcw data-icon="inline-start" />
                      Retry
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

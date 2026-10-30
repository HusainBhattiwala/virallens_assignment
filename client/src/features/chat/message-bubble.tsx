import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AssistantAvatar } from "./assistant-avatar"
import type { MessageRole } from "./chat-api"

interface MessageBubbleProps {
  role: MessageRole
  content: string
  meta?: ReactNode
  isFailed?: boolean
}

const SPEAKER_LABEL: Record<MessageRole, string> = {
  user: "You said",
  assistant: "Harbor said",
}

export function MessageBubble({ role, content, meta, isFailed = false }: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {isUser ? null : <AssistantAvatar />}
      <div className={cn("flex max-w-[85%] min-w-0 flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <p
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-tl-md bg-card text-card-foreground ring-1 ring-border",
            isFailed && "bg-primary/60"
          )}
        >
          <span className="sr-only">{SPEAKER_LABEL[role]}: </span>
          {content}
        </p>
        {meta}
      </div>
    </div>
  )
}

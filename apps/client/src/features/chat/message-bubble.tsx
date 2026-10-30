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

export function MessageBubble({
  role,
  content,
  meta,
  isFailed = false,
}: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p
          className={cn(
            "max-w-[80%] rounded-2xl bg-secondary px-4 py-2.5 text-[0.9375rem] leading-7 break-words whitespace-pre-wrap text-secondary-foreground",
            isFailed && "opacity-70 ring-1 ring-destructive/50"
          )}
        >
          <span className="sr-only">{SPEAKER_LABEL.user}: </span>
          {content}
        </p>
        {meta}
      </div>
    )
  }

  return (
    <div className="flex gap-3.5">
      <AssistantAvatar />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
        <p className="text-[0.9375rem] leading-7 break-words whitespace-pre-wrap">
          <span className="sr-only">{SPEAKER_LABEL.assistant}: </span>
          {content}
        </p>
        {meta}
      </div>
    </div>
  )
}

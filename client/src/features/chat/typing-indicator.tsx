import { AssistantAvatar } from "./assistant-avatar"

const DOT_DELAYS_MS = [0, 160, 320]

export function TypingIndicator() {
  return (
    <div className="flex gap-3" role="status">
      <AssistantAvatar />
      <div className="flex h-10 items-center gap-1.5 rounded-2xl rounded-tl-md bg-card px-4 ring-1 ring-border">
        {DOT_DELAYS_MS.map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="size-2 animate-signal rounded-full bg-signal motion-reduce:animate-none"
            style={{ animationDelay: `${String(delay)}ms` }}
          />
        ))}
        <span className="sr-only">Harbor is typing</span>
      </div>
    </div>
  )
}

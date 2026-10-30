import { AssistantAvatar } from "./assistant-avatar"

const DOT_DELAYS_MS = [0, 160, 320]

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3.5" role="status">
      <AssistantAvatar />
      <div className="flex h-8 items-center gap-1.5">
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

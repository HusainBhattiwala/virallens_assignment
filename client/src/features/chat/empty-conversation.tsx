import { LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

const SUGGESTIONS = [
  "Where is my order?",
  "I want to return an item",
  "How do I change my delivery address?",
  "My payment failed but I was charged",
]

interface EmptyConversationProps {
  onPick: (suggestion: string) => void
}

export function EmptyConversation({ onPick }: EmptyConversationProps) {
  return (
    <Empty className="h-full border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-xl bg-primary text-signal">
          <LifeBuoy className="size-6" strokeWidth={2.25} />
        </EmptyMedia>
        <EmptyTitle className="text-2xl font-semibold tracking-tight">How can we help today?</EmptyTitle>
        <EmptyDescription>
          Ask about orders, deliveries, returns or your account. Replies usually arrive within a few seconds.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-lg">
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              className="rounded-full"
              onClick={() => {
                onPick(suggestion)
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </EmptyContent>
    </Empty>
  )
}

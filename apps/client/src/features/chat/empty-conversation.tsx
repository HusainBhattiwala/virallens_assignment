import { LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const SUGGESTIONS = [
  "Where is my order HB-1043?",
  "My blender from order HB-1044 arrived damaged",
  "Can I change the address for order HB-1042?",
  "I was charged twice for order HB-1046",
]

interface EmptyConversationProps {
  onPick: (suggestion: string) => void
}

export function EmptyConversation({ onPick }: EmptyConversationProps) {
  return (
    <Empty className="h-full border-0">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-xl bg-primary text-primary-foreground"
        >
          <LifeBuoy className="size-6" strokeWidth={2.25} />
        </EmptyMedia>
        <EmptyTitle className="text-2xl font-semibold tracking-tight">
          How can we help today?
        </EmptyTitle>
        <EmptyDescription>
          Ask about orders, deliveries, returns or your account. Replies usually
          arrive within a few seconds.
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

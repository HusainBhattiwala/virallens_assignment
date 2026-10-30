import { LifeBuoy } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AssistantAvatar() {
  return (
    <Avatar className="mt-0.5" aria-hidden="true">
      <AvatarFallback className="bg-primary text-primary-foreground">
        <LifeBuoy className="size-4" strokeWidth={2.25} />
      </AvatarFallback>
    </Avatar>
  )
}

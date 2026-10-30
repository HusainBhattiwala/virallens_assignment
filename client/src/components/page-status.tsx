import { RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

export function PageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <Spinner className="size-6 text-muted-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

interface ServiceUnavailableProps {
  message: string
  onRetry: () => void
}

export function ServiceUnavailable({ message, onRetry }: ServiceUnavailableProps) {
  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WifiOff />
        </EmptyMedia>
        <EmptyTitle>Harbor is unreachable</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}

import { LifeBuoy } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-signal", className)}
    >
      <LifeBuoy className="size-4.5" strokeWidth={2.25} />
    </span>
  )
}

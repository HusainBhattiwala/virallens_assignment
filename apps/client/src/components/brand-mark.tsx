import { LifeBuoy } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandProps {
  className?: string
}

function BrandMark({ className }: BrandProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-signal",
        className
      )}
    >
      <LifeBuoy className="size-4.5" strokeWidth={2.25} />
    </span>
  )
}

export function BrandLogo({ className }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="text-base font-semibold tracking-tight">Harbor</span>
    </div>
  )
}

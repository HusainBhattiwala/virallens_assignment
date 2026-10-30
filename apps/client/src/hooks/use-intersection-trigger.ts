import { useCallback } from "react"

interface IntersectionTriggerOptions {
  enabled: boolean
  onIntersect: () => void
}

export function useIntersectionTrigger({
  enabled,
  onIntersect,
}: IntersectionTriggerOptions) {
  return useCallback(
    (element: Element | null) => {
      if (!element || !enabled) return undefined

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) onIntersect()
        },
        { rootMargin: "160px" }
      )
      observer.observe(element)
      return () => {
        observer.disconnect()
      }
    },
    [enabled, onIntersect]
  )
}

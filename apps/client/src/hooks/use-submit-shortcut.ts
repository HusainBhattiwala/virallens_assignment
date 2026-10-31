import { type CompositionEvent, type KeyboardEvent, useRef } from "react"

const COMPOSITION_END_WINDOW_MS = 50

export const useSubmitShortcut = () => {
  const compositionEndedAt = useRef<number | null>(null)

  const onCompositionEnd = (event: CompositionEvent<HTMLTextAreaElement>) => {
    compositionEndedAt.current = event.timeStamp
  }

  const isComposing = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    const endedAt = compositionEndedAt.current
    return (
      event.nativeEvent.isComposing ||
      (endedAt !== null &&
        Math.abs(event.timeStamp - endedAt) < COMPOSITION_END_WINDOW_MS)
    )
  }

  const isSubmitShortcut = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ): boolean => event.key === "Enter" && !event.shiftKey && !isComposing(event)

  return { onCompositionEnd, isComposing, isSubmitShortcut }
}

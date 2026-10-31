import { ArrowUp } from "lucide-react"
import { type KeyboardEvent, type SubmitEvent, useState } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { useSubmitShortcut } from "@/hooks/use-submit-shortcut"

export const MESSAGE_MAX_LENGTH = 4000

interface ComposerProps {
  isSending: boolean
  isBlocked: boolean
  onSend: (content: string) => void
}

export function Composer({ isSending, isBlocked, onSend }: ComposerProps) {
  const [draft, setDraft] = useState("")
  const { onCompositionEnd, isSubmitShortcut } = useSubmitShortcut()
  const content = draft.trim()
  const canSend = content.length > 0 && !isSending && !isBlocked

  const submit = () => {
    if (!canSend) return
    onSend(content)
    setDraft("")
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitShortcut(event)) return
    event.preventDefault()
    submit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-3xl px-4 pt-2 pb-5 sm:px-6"
    >
      <InputGroup className="rounded-2xl bg-card shadow-sm dark:bg-card">
        <InputGroupTextarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          onKeyDown={handleKeyDown}
          onCompositionEnd={onCompositionEnd}
          placeholder="Ask about an order, a delivery or a refund"
          aria-label="Message"
          maxLength={MESSAGE_MAX_LENGTH}
          rows={1}
          autoFocus
          className="max-h-48 min-h-12 px-4 pt-3.5 text-[0.9375rem]"
        />
        <InputGroupAddon align="block-end" className="px-3 pb-3">
          <InputGroupText className="hidden text-xs sm:flex">
            <KbdGroup>
              <Kbd>Shift</Kbd>
              <Kbd>Enter</Kbd>
            </KbdGroup>
            for a new line
          </InputGroupText>
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            className="ml-auto rounded-full aria-disabled:pointer-events-none aria-disabled:opacity-50"
            aria-disabled={!canSend}
            aria-label="Send message"
          >
            {isSending ? <Spinner /> : <ArrowUp />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

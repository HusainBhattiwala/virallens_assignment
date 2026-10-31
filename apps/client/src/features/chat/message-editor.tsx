import {
  type KeyboardEvent,
  type SubmitEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { useSubmitShortcut } from "@/hooks/use-submit-shortcut"
import { MESSAGE_MAX_LENGTH } from "./composer"

interface MessageEditorProps {
  initialContent: string
  onCancel: () => void
  onSubmit: (content: string) => void
}

export function MessageEditor({
  initialContent,
  onCancel,
  onSubmit,
}: MessageEditorProps) {
  const [draft, setDraft] = useState(initialContent)
  const { onCompositionEnd, isComposing, isSubmitShortcut } =
    useSubmitShortcut()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const content = draft.trim()
  const canSubmit = content.length > 0 && content !== initialContent.trim()

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [])

  const submit = () => {
    if (canSubmit) onSubmit(content)
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && !isComposing(event)) {
      event.preventDefault()
      onCancel()
      return
    }
    if (!isSubmitShortcut(event)) return
    event.preventDefault()
    submit()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <InputGroup className="rounded-2xl bg-card shadow-sm dark:bg-card">
        <InputGroupTextarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          onKeyDown={handleKeyDown}
          onCompositionEnd={onCompositionEnd}
          aria-label="Edit message"
          maxLength={MESSAGE_MAX_LENGTH}
          className="max-h-72 min-h-12 px-4 pt-3.5 text-[0.9375rem]"
        />
        <InputGroupAddon
          align="block-end"
          className="justify-end gap-2 px-3 pb-3"
        >
          <InputGroupButton size="sm" onClick={onCancel}>
            Cancel
          </InputGroupButton>
          <InputGroupButton
            type="submit"
            variant="default"
            size="sm"
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            aria-disabled={!canSubmit}
          >
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

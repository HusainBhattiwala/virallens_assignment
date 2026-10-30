import { Search, X } from "lucide-react"
import type { KeyboardEvent } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

interface ConversationSearchProps {
  value: string
  isPending: boolean
  onChange: (value: string) => void
}

export function ConversationSearch({
  value,
  isPending,
  onChange,
}: ConversationSearchProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape" || !value) return
    event.preventDefault()
    onChange("")
  }

  return (
    <InputGroup className="h-8 bg-background">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search conversations"
        aria-label="Search conversations"
        maxLength={100}
      />
      {isPending ? (
        <InputGroupAddon align="inline-end">
          <Spinner />
        </InputGroupAddon>
      ) : null}
      {!isPending && value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => {
              onChange("")
            }}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Composer } from "./composer"

const renderComposer = () => {
  const onSend = vi.fn()
  render(<Composer isSending={false} isBlocked={false} onSend={onSend} />)
  return { onSend, input: screen.getByRole("textbox", { name: "Message" }) }
}

describe("Composer", () => {
  it("sends the trimmed message on Enter and clears the input", async () => {
    const { onSend, input } = renderComposer()

    await userEvent.type(input, "  Where is my order?  {Enter}")

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Where is my order?")
    expect(input).toHaveValue("")
  })

  it("adds a new line on Shift+Enter instead of sending", async () => {
    const { onSend, input } = renderComposer()

    await userEvent.type(input, "Line one{Shift>}{Enter}{/Shift}Line two")

    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue("Line one\nLine two")
  })

  it("does not send when Enter confirms an IME composition", async () => {
    const { onSend, input } = renderComposer()
    await userEvent.type(input, "にほんご")

    fireEvent.keyDown(input, { key: "Enter", isComposing: true })

    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue("にほんご")
  })
})

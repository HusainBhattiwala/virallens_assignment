import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "./auth-store"
import { RequireAuth, RequireGuest } from "./route-guards"

const USER = { id: "u1", email: "jane@example.com" }

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<p>Login page</p>} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/chat" element={<p>Chat page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

afterEach(() => {
  useAuthStore.setState(useAuthStore.getInitialState(), true)
})

describe("route guards", () => {
  it("redirects a guest from a protected page to login", () => {
    useAuthStore.setState({ status: "guest" })

    renderAt("/chat")

    expect(screen.getByText("Login page")).toBeInTheDocument()
    expect(screen.queryByText("Chat page")).not.toBeInTheDocument()
  })

  it("shows a protected page to a logged-in user", () => {
    useAuthStore.setState({ user: USER, status: "authenticated" })

    renderAt("/chat")

    expect(screen.getByText("Chat page")).toBeInTheDocument()
  })

  it("sends a logged-in user from login to the chat", () => {
    useAuthStore.setState({ user: USER, status: "authenticated" })

    renderAt("/login")

    expect(screen.getByText("Chat page")).toBeInTheDocument()
  })

  it("offers a retry instead of a redirect when the session check fails", async () => {
    const restoreSession = vi.fn().mockResolvedValue(undefined)
    useAuthStore.setState({
      status: "unavailable",
      error: "Can't reach the server.",
      restoreSession,
    })

    renderAt("/chat")
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(screen.getByText("Can't reach the server.")).toBeInTheDocument()
    expect(screen.queryByText("Login page")).not.toBeInTheDocument()
    expect(restoreSession).toHaveBeenCalledOnce()
  })
})

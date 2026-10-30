import { mutate } from "swr"
import { toast } from "sonner"
import { create } from "zustand"
import { getErrorMessage, isUnauthorized } from "@/lib/api"
import {
  type Credentials,
  fetchSession,
  login,
  logout,
  signup,
  type User,
} from "./auth-api"

export type SessionStatus =
  "loading" | "authenticated" | "guest" | "unavailable"

interface AuthState {
  user: User | null
  status: SessionStatus
  error: string | null
  restoreSession: () => Promise<void>
  login: (credentials: Credentials) => Promise<void>
  signup: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
  expireSession: () => void
}

const GUEST_STATE = { user: null, status: "guest", error: null } as const

const clearServerCache = (): void => {
  void mutate(() => true, undefined, { revalidate: false })
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const authenticate = async (request: Promise<User>): Promise<void> => {
    const user = await request
    set({ user, status: "authenticated", error: null })
  }

  return {
    user: null,
    status: "loading",
    error: null,

    restoreSession: async () => {
      set({ status: "loading", error: null })
      try {
        const user = await fetchSession()
        set({ user, status: user ? "authenticated" : "guest" })
      } catch (error) {
        set({
          user: null,
          status: "unavailable",
          error: getErrorMessage(error),
        })
      }
    },

    login: (credentials) => authenticate(login(credentials)),

    signup: (credentials) => authenticate(signup(credentials)),

    logout: async () => {
      await logout()
      clearServerCache()
      set(GUEST_STATE)
    },

    expireSession: () => {
      if (get().status !== "authenticated") return
      clearServerCache()
      set(GUEST_STATE)
      toast.info("Your session has ended", {
        description: "Log in again to continue.",
      })
    },
  }
})

export const endSessionIfUnauthorized = (error: unknown): boolean => {
  if (!isUnauthorized(error)) return false
  useAuthStore.getState().expireSession()
  return true
}

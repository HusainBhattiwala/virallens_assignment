import { z } from "zod"
import { apiCommand, apiRequest, isUnauthorized } from "@/lib/api"

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
})

const userResponseSchema = z.object({ user: userSchema })

export type User = z.infer<typeof userSchema>

export interface Credentials {
  email: string
  password: string
}

export const fetchSession = async (): Promise<User | null> => {
  try {
    const { user } = await apiRequest("/auth/me", userResponseSchema)
    return user
  } catch (error) {
    if (isUnauthorized(error)) return null
    throw error
  }
}

export const login = async (credentials: Credentials): Promise<User> => {
  const { user } = await apiRequest("/auth/login", userResponseSchema, {
    method: "POST",
    body: credentials,
  })
  return user
}

export const signup = async (credentials: Credentials): Promise<User> => {
  const { user } = await apiRequest("/auth/signup", userResponseSchema, {
    method: "POST",
    body: credentials,
  })
  return user
}

export const logout = (): Promise<void> =>
  apiCommand("/auth/logout", { method: "POST" })

import { createAuthClient } from "better-auth/client"
import { AUTH_API_URL, networkError, toApiErrorWith } from "@/lib/api"

const authClient = createAuthClient({ baseURL: AUTH_API_URL })

export interface User {
  id: string
  email: string
}

export interface Credentials {
  email: string
  password: string
}

interface AuthResult<T> {
  data: T | null
  error: { status: number; message?: string | undefined } | null
}

const callAuth = async <T>(
  request: () => Promise<AuthResult<T>>
): Promise<T | null> => {
  let result: AuthResult<T>
  try {
    result = await request()
  } catch {
    throw networkError()
  }
  if (result.error) {
    throw toApiErrorWith(result.error.status, result.error.message)
  }
  return result.data
}

const toUser = ({ id, email }: User): User => ({ id, email })

const requireUser = (data: { user: User } | null): User => {
  if (!data) throw toApiErrorWith(500, undefined)
  return toUser(data.user)
}

const nameFromEmail = (email: string): string => email.split("@")[0] ?? email

export const fetchSession = async (): Promise<User | null> => {
  const session = await callAuth(() => authClient.getSession())
  return session ? toUser(session.user) : null
}

export const login = async ({ email, password }: Credentials): Promise<User> =>
  requireUser(
    await callAuth(() => authClient.signIn.email({ email, password }))
  )

export const signup = async ({ email, password }: Credentials): Promise<User> =>
  requireUser(
    await callAuth(() =>
      authClient.signUp.email({ email, password, name: nameFromEmail(email) })
    )
  )

export const logout = async (): Promise<void> => {
  await callAuth(() => authClient.signOut())
}

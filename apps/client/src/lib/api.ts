import { z } from "zod"

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error(
    "VITE_API_URL is not set. Copy .env.example to .env and set the API address."
  )
}

export const AUTH_API_URL = new URL(`${API_URL}/auth`, window.location.origin)
  .href

const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Check your connection and try again."
const UNEXPECTED_RESPONSE_MESSAGE =
  "The server sent an unexpected response. Try again."
const UNKNOWN_ERROR_MESSAGE = "Something went wrong. Try again."

const errorBodySchema = z.object({
  error: z.string(),
  details: z
    .object({
      fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
    })
    .optional(),
})

export type FieldErrors = Partial<Record<string, string[]>>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const networkError = (): ApiError =>
  new ApiError(0, NETWORK_ERROR_MESSAGE)

export const toApiErrorWith = (
  status: number,
  message: string | undefined
): ApiError => new ApiError(status, message ?? UNKNOWN_ERROR_MESSAGE)

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
}

const send = async (
  path: string,
  { method = "GET", body }: RequestOptions
): Promise<Response> => {
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw networkError()
  }
}

const readJson = async (response: Response): Promise<unknown> =>
  response.json().catch(() => null)

const toApiError = async (response: Response): Promise<ApiError> => {
  const parsed = errorBodySchema.safeParse(await readJson(response))

  return parsed.success
    ? new ApiError(
        response.status,
        parsed.data.error,
        parsed.data.details?.fieldErrors
      )
    : new ApiError(response.status, UNKNOWN_ERROR_MESSAGE)
}

export const apiRequest = async <T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {}
): Promise<T> => {
  const response = await send(path, options)
  if (!response.ok) throw await toApiError(response)

  const parsed = schema.safeParse(await readJson(response))
  if (!parsed.success)
    throw new ApiError(response.status, UNEXPECTED_RESPONSE_MESSAGE)

  return parsed.data
}

export const apiCommand = async (
  path: string,
  options: RequestOptions = {}
): Promise<void> => {
  const response = await send(path, options)
  if (!response.ok) throw await toApiError(response)
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof ApiError ? error.message : UNKNOWN_ERROR_MESSAGE

export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401

import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { ApiError, apiRequest } from "./api"

const schema = z.object({ id: z.string() })

const respondWith = (status: number, body: unknown) => {
  const fetch = vi.fn().mockResolvedValue(Response.json(body, { status }))
  vi.stubGlobal("fetch", fetch)
  return fetch
}

const requestError = async (promise: Promise<unknown>): Promise<ApiError> => {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason
  )
  if (!(error instanceof ApiError)) {
    throw new Error("Expected the request to fail with an ApiError")
  }
  return error
}

describe("apiRequest", () => {
  it("sends a JSON body with the session cookie and returns the parsed response", async () => {
    const fetch = respondWith(200, { id: "c1" })

    await expect(
      apiRequest("/chat/send", schema, {
        method: "POST",
        body: { message: "Hi" },
      })
    ).resolves.toEqual({ id: "c1" })
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/chat/send",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ message: "Hi" }),
      })
    )
  })

  it("turns an error response into an ApiError with the server's message and field errors", async () => {
    respondWith(400, {
      error: "Validation failed",
      details: { fieldErrors: { message: ["Too long"] } },
    })

    const error = await requestError(apiRequest("/chat/send", schema))

    expect(error).toMatchObject({
      status: 400,
      message: "Validation failed",
      fieldErrors: { message: ["Too long"] },
    })
  })

  it("reports an unreachable server as a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    )

    const error = await requestError(apiRequest("/chat/history", schema))

    expect(error.status).toBe(0)
    expect(error.message).toMatch(/can't reach the server/i)
  })

  it("rejects a successful response that doesn't match the expected shape", async () => {
    respondWith(200, { unexpected: true })

    const error = await requestError(apiRequest("/chat/history", schema))

    expect(error.status).toBe(200)
    expect(error.message).toMatch(/unexpected response/i)
  })
})

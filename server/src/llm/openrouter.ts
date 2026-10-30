import { OpenRouter } from "@openrouter/sdk";
import type { ChatResult } from "@openrouter/sdk/models";
import { OpenRouterError, TooManyRequestsResponseError } from "@openrouter/sdk/models/errors";
import createHttpError from "http-errors";
import { env } from "@/config/env.js";
import { toError } from "@/lib/errors.js";
import type { MessageRole } from "@/models/message.model.js";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

const { OPENROUTER_API_KEY, OPENROUTER_MODEL, CLIENT_ORIGIN } = env;

const APP_TITLE = "AI Customer Support Agent";
const REQUEST_TIMEOUT_MS = 60_000;
const FREE_MODELS_ROUTER = "openrouter/free";
const MODELS = [...new Set([OPENROUTER_MODEL, FREE_MODELS_ROUTER])];

const SYSTEM_PROMPT = [
  "You are a friendly and professional customer support assistant.",
  "Answer clearly and concisely, ask a clarifying question when the request is ambiguous,",
  "and never invent order details, policies, or account information you were not given.",
  "If you cannot resolve an issue, explain the next step the customer should take.",
  "Reply in plain text without Markdown formatting, using short paragraphs.",
].join(" ");

const openrouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
  httpReferer: CLIENT_ORIGIN,
  appTitle: APP_TITLE,
  timeoutMs: REQUEST_TIMEOUT_MS,
});

const toServiceError = (error: Error): Error => {
  const details = { expose: true, cause: error, upstream: error instanceof OpenRouterError ? error.body : undefined };

  return error instanceof TooManyRequestsResponseError
    ? createHttpError(503, "The assistant is busy right now, please try again shortly", details)
    : createHttpError(502, "The assistant is unavailable right now, please try again", details);
};

const requestCompletion = async (messages: ChatMessage[]): Promise<ChatResult> => {
  try {
    return await openrouter.chat.send({
      chatRequest: {
        models: MODELS,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: false,
      },
    });
  } catch (err) {
    throw toServiceError(toError(err));
  }
};

export const generateReply = async (messages: ChatMessage[]): Promise<string> => {
  const result = await requestCompletion(messages);
  const content = result.choices[0]?.message.content;
  const reply = typeof content === "string" ? content.trim() : "";

  if (!reply) {
    throw createHttpError(502, "The assistant returned an empty reply, please try again", { expose: true });
  }

  return reply;
};

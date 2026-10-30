# Harbor server

REST API for the Harbor support chat: accounts and sessions, conversation storage in MongoDB, and AI replies through OpenRouter.

**Stack:** Node.js 22, Express 5, TypeScript, Mongoose 9, zod 4, JWT, bcrypt, pino, `@openrouter/sdk`.

## Setup

Requires Node.js 22 or newer, a MongoDB connection string (Atlas) and an OpenRouter API key.

```bash
cp .env.example .env
npm install
npm run dev
```

The API runs on http://localhost:4000. `GET /health` returns `{"status":"ok"}`.

## Environment variables

They're validated at startup, and the server refuses to start if any are invalid.

| Variable             | Required | Default                          | Description                                                   |
| -------------------- | -------- | -------------------------------- | ------------------------------------------------------------- |
| `MONGO_URI`          | Yes      |                                  | MongoDB connection string                                     |
| `JWT_SECRET`         | Yes      |                                  | At least 32 characters (`openssl rand -hex 32`)               |
| `OPENROUTER_API_KEY` | Yes      |                                  | OpenRouter API key                                            |
| `CLIENT_ORIGIN`      | Yes      |                                  | Client URL allowed by CORS                                    |
| `OPENROUTER_MODEL`   | No       | `google/gemma-4-26b-a4b-it:free` | Model to try first                                            |
| `NODE_ENV`           | No       | `development`                    | `production` switches to JSON logs and hides error details    |
| `PORT`               | No       | `4000`                           | HTTP port                                                     |
| `LOG_LEVEL`          | No       | `info`                           | Pino log level                                                |
| `COOKIE_SAME_SITE`   | No       | `lax`                            | Use `none` only for a client on another site (needs HTTPS)    |

## Scripts

| Script                    | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `npm run dev`             | Start with tsx in watch mode                                         |
| `npm run build`           | Compile to `dist/` (`tsc`, then `tsc-alias` to rewrite `@/` imports) |
| `npm start`               | Run the compiled server                                              |
| `npm run check`           | Type check and lint                                                  |
| `npm run typecheck:watch` | Type check on every change; tsx doesn't type-check                   |

## API

JSON in and out. Routes marked "Yes" under Auth require the `session` cookie, which signup and login set.

| Method | Path                            | Auth | Body                           | Response                                         |
| ------ | ------------------------------- | ---- | ------------------------------ | ------------------------------------------------ |
| POST   | `/auth/signup`                  | No   | `{ email, password }`          | `201 { user }` and sets the cookie               |
| POST   | `/auth/login`                   | No   | `{ email, password }`          | `200 { user }` and sets the cookie               |
| POST   | `/auth/logout`                  | No   |                                | `204` and clears the cookie                      |
| GET    | `/auth/me`                      | Yes  |                                | `200 { user }`                                   |
| POST   | `/chat/send`                    | Yes  | `{ message, conversationId? }` | `201 { conversationId, messages }`               |
| GET    | `/chat/history`                 | Yes  |                                | `200 { conversations }`, most recent first       |
| GET    | `/chat/history/:conversationId` | Yes  |                                | `200 { messages }`, oldest first                 |

**Response shapes**

| Shape          | Fields                                                    |
| -------------- | --------------------------------------------------------- |
| `user`         | `{ id, email }`                                           |
| `conversation` | `{ id, title, createdAt, updatedAt }`                     |
| `message`      | `{ id, conversationId, role, content, createdAt }`        |

**Rules**
- Passwords are 8 to 72 characters.
- Messages are 1 to 4,000 characters.
- Leave out `conversationId` to start a new conversation. Its title is the first 60 characters of the message.
- Another user's conversation returns 404.

### Errors

Errors return `{ "error": "message" }`. Validation errors (400) also include `details.fieldErrors`.

| Status | When                                                    |
| ------ | ------------------------------------------------------- |
| 400    | Invalid body, parameter or JSON                         |
| 401    | Missing or expired session, or wrong credentials        |
| 404    | Unknown route or conversation                           |
| 409    | Email already registered                                |
| 429    | Rate limited (100 per 15 min, 20 for login and signup)  |
| 502    | AI provider failed or returned an empty reply           |
| 503    | AI provider is busy                                     |

Each response has an `X-Request-Id` header that matches `reqId` in the logs.

### Postman

Import [`postman/support-agent.postman_collection.json`](postman/support-agent.postman_collection.json). It documents every route and includes example responses and tests. Postman keeps the session cookie, and the new-conversation request saves `conversationId` for the follow-ups.

## Structure

```
src/
  server.ts           database connection, HTTP server, graceful shutdown
  app.ts              middleware, routes, error handling
  auth/               signup, login, logout, sessions, requireAuth
  chat/               send message, conversation and message history
  llm/openrouter.ts   OpenRouter client, system prompt, error mapping
  models/             User, Conversation, Message
  middleware/         request logger, error handler
  config/             env validation, logger, database
  lib/errors.ts       error normalisation
```

Each feature has three parts:
- `*.routes.ts`: HTTP handling.
- `*.service.ts`: logic.
- `*.schema.ts`: zod validation.

Imports outside the current folder use `@/`.

## How it works

### Sessions
- Login creates a 7-day HS256 JWT in an `httpOnly` cookie named `session`.
- The cookie is `Secure` when the request came over HTTPS, including behind a proxy.
- `requireAuth` sets `req.userId`, and every query is filtered by it.

### AI replies
For each message, the server:
1. Loads the last 20 messages of the conversation.
2. Sends the system prompt, that history and the new message to OpenRouter. It tries `OPENROUTER_MODEL` first, then `openrouter/free`, with a 60-second timeout.
3. Saves the message and the reply together, only if the model answers.

Messages older than the last 20 aren't sent to the model.

### Logging
- Development prints one line per request, for example `POST /chat/send 201 1834ms`.
- Production prints one JSON line per request.
- Expected failures log the reason without a stack trace. Unexpected errors include the stack.
- `/health` isn't logged.

## Docker

The [`Dockerfile`](Dockerfile) compiles in one stage and runs `dist/` with production dependencies only, as the non-root `node` user. The root [`docker-compose.yml`](../docker-compose.yml) runs it with `server/.env` and `NODE_ENV=production`.

## Vercel

[`vercel.json`](vercel.json) runs `npm run build` and sends every request to [`api/index.js`](api/index.js). That file re-exports `src/vercel.ts`, which wraps the same Express app and connects to MongoDB on the first request. Steps are in the [root README](../README.md#deploy-to-vercel).

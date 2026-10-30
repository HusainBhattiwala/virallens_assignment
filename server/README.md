# Server

Express API for the AI Customer Support Agent. It handles authentication, stores conversations in MongoDB and generates replies with OpenRouter.

## Setup

```bash
cp .env.example .env
bun install
bun run dev
```

Run these from the `server` directory. `bun install` installs the whole workspace from the root lockfile.

The API runs at http://localhost:4000. `GET /api/health` returns `{"status":"ok"}`.

## Environment variables

| Variable             | Required | Default                          | Description                                                   |
| -------------------- | -------- | -------------------------------- | ------------------------------------------------------------- |
| `MONGO_URI`          | Yes      |                                  | MongoDB connection string                                     |
| `JWT_SECRET`         | Yes      |                                  | Secret for signing session tokens, at least 32 characters     |
| `OPENROUTER_API_KEY` | Yes      |                                  | OpenRouter API key                                            |
| `CLIENT_ORIGIN`      | Yes      |                                  | URL of the frontend, allowed by CORS                          |
| `OPENROUTER_MODEL`   | No       | `google/gemma-4-26b-a4b-it:free` | Model used for replies                                        |
| `NODE_ENV`           | No       | `development`                    | Set to `production` for JSON logs and generic error messages  |
| `PORT`               | No       | `4000`                           | Port the server listens on                                    |
| `LOG_LEVEL`          | No       | `info`                           | Pino log level                                                |
| `COOKIE_SAME_SITE`   | No       | `lax`                            | Set to `none` only if the frontend is on a different site     |

The server validates these at startup and exits with a list of problems if any are missing or invalid.

## Scripts

| Script                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `bun run dev`             | Start in watch mode                            |
| `bun run build`           | Compile to `dist/`                             |
| `bun run start`           | Run the compiled build                         |
| `bun run check`           | Type check and lint                            |
| `bun run typecheck:watch` | Type check on every file change                |

## API reference

All endpoints are under `/api/v1`. Requests and responses use JSON. Protected routes need the `session` cookie, which is set on signup and login.

### Auth

| Method | Endpoint              | Body                  | Response                    |
| ------ | --------------------- | --------------------- | --------------------------- |
| POST   | `/api/v1/auth/signup` | `{ email, password }` | `201 { user }`              |
| POST   | `/api/v1/auth/login`  | `{ email, password }` | `200 { user }`              |
| POST   | `/api/v1/auth/logout` |                       | `204`                       |
| GET    | `/api/v1/auth/me`     |                       | `200 { user }` (protected)  |

### Chat

All chat routes are protected.

| Method | Endpoint                               | Body                           | Response                            |
| ------ | -------------------------------------- | ------------------------------ | ----------------------------------- |
| POST   | `/api/v1/chat/send`                    | `{ message, conversationId? }` | `201 { conversationId, messages }`  |
| GET    | `/api/v1/chat/history`                 |                                | `200 { conversations }`             |
| GET    | `/api/v1/chat/history/:conversationId` |                                | `200 { messages }`                  |

Leave out `conversationId` to start a new conversation. `/api/v1/chat/send` returns the saved user message and the assistant's reply.

### Data shapes

```ts
type User = { id: string; email: string };
type Conversation = { id: string; title: string; createdAt: string; updatedAt: string };
type Message = { id: string; conversationId: string; role: "user" | "assistant"; content: string; createdAt: string };
```

### Validation

- Passwords must be 8 to 72 characters.
- Messages must be 1 to 4000 characters.
- Requesting a conversation that belongs to another user returns `404`.

### Errors

Errors return `{ "error": "message" }`. Validation errors also include `details.fieldErrors`.

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 400    | Invalid request body or parameter               |
| 401    | Not logged in, or wrong email or password       |
| 404    | Route or conversation not found                 |
| 409    | Email already registered                        |
| 429    | Too many requests                               |
| 502    | The AI provider failed                          |
| 503    | The AI provider is busy                         |

Rate limits are 100 requests per 15 minutes per IP, and 20 per 15 minutes for login and signup.

## How replies are generated

When a message is sent, the server loads the last 20 messages of the conversation and sends them to OpenRouter with a system prompt. If the configured model is unavailable, OpenRouter falls back to its free model router. The user message and the reply are saved together once the reply arrives, so a failed request doesn't leave a partial conversation.

## Project structure

```
src/
  auth/          signup, login, logout and session handling
  chat/          sending messages and reading history
  llm/           OpenRouter client and system prompt
  models/        Mongoose models for users, conversations and messages
  middleware/    rate limiting, request logging and error handling
  config/        environment, logger and database setup
  app.ts         Express app
  server.ts      entry point for Docker and local development
  vercel.ts      entry point for Vercel
```

## Deployment

- **Docker:** the [Dockerfile](Dockerfile) is built from the repository root so it can use the workspace lockfile. Bun installs the dependencies and Node runs `dist/server.js`. See [docker-compose.yml](../docker-compose.yml).
- **Vercel:** the API is deployed together with the frontend as one project. The root [`api/index.js`](../api/index.js) loads `dist/vercel.js`, which connects to MongoDB and passes each `/api` request to the Express app. See the [root README](../README.md#deployment).

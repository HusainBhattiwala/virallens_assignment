# Server

Express API for the AI Customer Support Agent. It handles authentication, stores conversations in MongoDB and generates replies with OpenRouter.

## Setup

```bash
cp .env.example .env
bun install
bun run dev
```

Run these from `apps/server`. `bun install` installs the whole workspace from the root lockfile. From the repository root, the same scripts run with `bun run --filter @support-agent/server <script>`.

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

| Method | Endpoint                                     | Body                           | Response                             |
| ------ | -------------------------------------------- | ------------------------------ | ------------------------------------ |
| POST   | `/api/v1/chat/send`                          | `{ message, conversationId? }` | `201 { conversation, messages }`     |
| GET    | `/api/v1/chat/history`                       |                                | `200 { conversations, nextCursor }`  |
| GET    | `/api/v1/chat/history/:conversationId`       |                                | `200 { conversation, messages }`     |
| PATCH  | `/api/v1/chat/history/:conversationId`       | `{ title }`                    | `200 { conversation }`               |
| DELETE | `/api/v1/chat/history/:conversationId`       |                                | `204`                                |
| POST   | `/api/v1/chat/history/:conversationId/title` |                                | `200 { conversation }`               |

Leave out `conversationId` to start a new conversation. `/api/v1/chat/send` returns the conversation with the saved user message and the assistant's reply. A new conversation is titled with the start of its first message until `POST .../title` replaces it with a short title written by the AI.

Renaming a conversation or generating its title doesn't change `updatedAt`, so it keeps its place in the list. Deleting a conversation also deletes its messages.

### Pagination and search

`GET /api/v1/chat/history` returns conversations most recently active first, one page at a time.

| Query    | Description                                              |
| -------- | -------------------------------------------------------- |
| `limit`  | Page size, 1 to 50. Defaults to 20                       |
| `cursor` | The `nextCursor` from the previous page                  |
| `q`      | Case-insensitive search on the title, up to 100 characters |

Pagination uses a cursor over `(updatedAt, _id)` rather than an offset, so conversations that are created or updated while a user scrolls don't cause duplicates or skipped items. The cursor is opaque and `nextCursor` is `null` on the last page. The query is served by the `{ user, updatedAt, _id }` index.

### Data shapes

```ts
type User = { id: string; email: string };
type Conversation = { id: string; title: string; createdAt: string; updatedAt: string };
type Message = { id: string; conversationId: string; role: "user" | "assistant"; content: string; createdAt: string };
```

### Validation

- Passwords must be 8 to 72 characters.
- Messages must be 1 to 4000 characters.
- Titles must be 1 to 100 characters.
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

## Security

- Passwords are hashed with bcrypt.
- Sessions are JWTs stored in an httpOnly `session` cookie that lasts 7 days. The cookie is `Secure` over HTTPS, and its `SameSite` value comes from `COOKIE_SAME_SITE`.
- Helmet sets security headers, and CORS only allows `CLIENT_ORIGIN`.
- Users can only read or change their own conversations. Any other conversation returns `404`.

## How replies are generated

When a message is sent, the server loads the last 20 messages of the conversation and sends them to OpenRouter with a system prompt. If the configured model is unavailable, OpenRouter falls back to its free model router. The user message and the reply are saved together once the reply arrives, so a failed request doesn't leave a partial conversation.

## Project structure

```
src/
  auth/          signup, login, logout and session handling
  chat/          messages, conversation history, titles and pagination
  llm/           OpenRouter client and system prompt
  models/        Mongoose models for users, conversations and messages
  middleware/    rate limiting, request logging and error handling
  config/        environment, logger and database setup
  app.ts         Express app
  server.ts      entry point for Docker and local development
  vercel.ts      entry point for Vercel
```

## Deployment

- **Docker:** the [Dockerfile](Dockerfile) is built from the repository root so it can use the workspace lockfile. Bun installs the dependencies and Node runs `dist/server.js`. See [docker-compose.yml](../../docker-compose.yml).
- **Vercel:** the API is deployed together with the frontend as one project. The root [`api/index.js`](../../api/index.js) loads `dist/vercel.js`, which connects to MongoDB and passes each `/api` request to the Express app. See the [deployment guide](../../docs/deployment.md).

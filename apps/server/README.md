# Server

Express API for the AI Customer Support Agent. It handles authentication with [Better Auth](https://www.better-auth.com), stores conversations in MongoDB and generates replies with OpenRouter.

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
| `BETTER_AUTH_SECRET` | Yes      |                                  | Secret that signs and encrypts session cookies, at least 32 characters |
| `BETTER_AUTH_URL`    | Yes      |                                  | Public URL of the API, for example `http://localhost:4000`    |
| `OPENROUTER_API_KEY` | Yes      |                                  | OpenRouter API key                                            |
| `CLIENT_ORIGIN`      | Yes      |                                  | URL of the frontend, allowed by CORS                          |
| `OPENROUTER_MODEL`   | No       | `google/gemma-4-26b-a4b-it:free` | Model used for replies                                        |
| `NODE_ENV`           | No       | `development`                    | Set to `production` for JSON logs and generic error messages  |
| `PORT`               | No       | `4000`                           | Port the server listens on                                    |
| `LOG_LEVEL`          | No       | `info`                           | Pino log level                                                |

The server validates these at startup and exits with a list of problems if any are missing or invalid.

The `seed:admin` script also reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 8 characters) and the optional `ADMIN_NAME` (default `Admin`).

## Scripts

| Script                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `bun run dev`             | Start in watch mode                            |
| `bun run build`           | Compile to `dist/`                             |
| `bun run start`           | Run the compiled build                         |
| `bun run seed:admin`      | Create the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, if it doesn't exist. Needs a build |
| `bun run check`           | Type check and lint                            |
| `bun run test`            | Run the tests                                  |
| `bun run typecheck:watch` | Type check on every file change                |

## Tests

The tests send real HTTP requests to the Express app with [Supertest](https://github.com/forwardemail/supertest). Better Auth runs for real, and only OpenRouter is mocked. Each run starts a single-node MongoDB replica set in memory with [mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server), because chat writes use transactions, and empties every collection before each test. The first run downloads a MongoDB binary of about 80 MB. Tests never read `.env`, so they can't touch your Atlas database.

- `src/auth/session.test.ts`: requests without a session, untrusted origins, logout and banned users
- `src/chat/chat.routes.test.ts`: sending and continuing a conversation, nothing stored when the AI fails, validation, conversation privacy between users, and message editing

## API reference

All endpoints are under `/api/v1`. Requests and responses use JSON. Protected routes need the session cookies, which are set on sign up and log in.

### Auth

Better Auth serves every route under `/api/v1/auth`. The main ones:

| Method | Endpoint                         | Body                        | Response                  |
| ------ | -------------------------------- | --------------------------- | ------------------------- |
| POST   | `/api/v1/auth/sign-up/email`     | `{ email, password, name }` | `200 { token, user }`     |
| POST   | `/api/v1/auth/sign-in/email`     | `{ email, password }`       | `200 { token, user }`     |
| POST   | `/api/v1/auth/sign-out`          |                             | `200 { success }`         |
| GET    | `/api/v1/auth/get-session`       |                             | `200 { session, user }` or `null` |

Requests that carry cookies must also send an `Origin` header that matches `CLIENT_ORIGIN`, otherwise Better Auth rejects them with `403`. Browsers do this automatically. With curl or Postman, add the header yourself.

### Admin

The [admin plugin](https://www.better-auth.com/docs/plugins/admin) adds user management for users with the `admin` role. Log in as the admin with `/sign-in/email`, then call:

| Method | Endpoint                                  | Body                                     |
| ------ | ----------------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/auth/admin/list-users`           | Query: `searchValue`, `filterField`, `filterValue`, `limit`, `offset` |
| POST   | `/api/v1/auth/admin/ban-user`             | `{ userId, banReason?, banExpiresIn? }`  |
| POST   | `/api/v1/auth/admin/unban-user`           | `{ userId }`                             |
| POST   | `/api/v1/auth/admin/list-user-sessions`   | `{ userId }`                             |
| POST   | `/api/v1/auth/admin/revoke-user-sessions` | `{ userId }`                             |
| POST   | `/api/v1/auth/admin/set-role`             | `{ userId, role }`                       |
| POST   | `/api/v1/auth/admin/remove-user`          | `{ userId }`                             |

Banning a user deletes all of their sessions and blocks new logins until the ban is lifted or `banExpiresIn` seconds pass. A banned user's next write request (`POST`, `PATCH`, `DELETE`) returns `401` right away, because writes always check the session and the user's ban status in the database. Reads can use the 5-minute session cache, so they stop working once it expires.

```bash
curl -c admin.txt -H 'Origin: http://localhost:5173' -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"..."}' http://localhost:4000/api/v1/auth/sign-in/email
curl -b admin.txt -H 'Origin: http://localhost:5173' -H 'Content-Type: application/json' \
  -d '{"userId":"...","banReason":"Spam"}' http://localhost:4000/api/v1/auth/admin/ban-user
```

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
| PATCH  | `/api/v1/chat/history/:conversationId/messages/:messageId` | `{ message }`    | `200 { conversation, messages }`     |

Leave out `conversationId` to start a new conversation. `/api/v1/chat/send` returns the conversation with the saved user message and the assistant's reply. A new conversation is titled with the start of its first message until `POST .../title` replaces it with a short title written by the AI.

Renaming a conversation or generating its title doesn't change `updatedAt`, so it keeps its place in the list. Deleting a conversation also deletes its messages.

Editing a message works like editing a prompt in ChatGPT or Claude: the edited message and everything after it are replaced by the new message and a fresh reply. Only your own messages can be edited. The server gets the reply first, using the messages before the edited one as context, then swaps the messages in a MongoDB transaction. If generating the reply fails, the conversation is left as it was. The response contains the whole updated conversation.

Messages are ordered by a per-conversation `seq`, and each conversation stores its `messageCount`. Sending and editing only write if `messageCount` is still the value read before the reply was generated. If another tab sent or edited a message in the meantime, the request returns `409` instead of saving a reply built from out-of-date messages, and the client reloads the conversation. Deleting a conversation runs in a transaction too, so it can't interleave with an edit.

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

- Passwords must be 8 to 128 characters.
- Messages must be 1 to 4000 characters.
- Titles must be 1 to 100 characters.
- Requesting a conversation that belongs to another user returns `404`.

### Errors

Chat errors return `{ "error": "message" }`. Validation errors also include `details.fieldErrors`. Auth errors from Better Auth return `{ "message": "...", "code": "..." }`.

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 400    | Invalid request body or parameter               |
| 401    | Not logged in, or wrong email or password       |
| 403    | Banned user signing in, not an admin, or untrusted `Origin` |
| 404    | Route, conversation or message not found        |
| 409    | The conversation changed while the reply was being written |
| 422    | Email already registered                        |
| 429    | Too many requests                               |
| 502    | The AI provider failed                          |
| 503    | The AI provider is busy                         |

Rate limits are 100 requests per 15 minutes per IP for the whole API. In production, Better Auth also limits each IP to 3 sign-in or sign-up attempts per 10 seconds per path. It stores those counters in MongoDB, so the limit holds across serverless instances.

## Security

- Passwords are hashed with scrypt by Better Auth.
- The session works like a refresh token and access token pair, kept in two httpOnly, `SameSite=Lax` cookies that are `Secure` when `BETTER_AUTH_URL` uses HTTPS:
  - `better-auth.session_token` is the session, stored in MongoDB. It lasts 7 days, is extended once a day while in use, and can be revoked.
  - `better-auth.session_data` is a 5-minute JWE (A256CBC-HS512), encrypted with `BETTER_AUTH_SECRET`. While it's valid, requests are authenticated without a database lookup.
- `requireAuth` calls `auth.api.getSession` and forwards any refreshed cookies, so the server renews both cookies on normal API calls. The browser never handles tokens, so concurrent requests can't race to refresh them.
- Reads (`GET`) are authenticated from the session cache. Writes pass `disableCookieCache: true`, as the [docs recommend for sensitive operations](https://www.better-auth.com/docs/concepts/session-management#cookie-cache), so a ban, a revoked session or a sign-out on another device blocks writes immediately. Better Auth's own admin endpoints read the session from the database the same way.
- CSRF: Better Auth checks the `Origin` of its own routes against `trustedOrigins`. `requireAuth` applies the same check (`isTrustedOrigin`) to chat writes, so a request from another origin, even a sibling subdomain that receives the `SameSite=Lax` cookies, gets `403`.
- `requireAuth` also rejects users with an active ban, so a session created by a login that raced with a ban can't be used for writes.
- Better Auth's MongoDB adapter doesn't create indexes for its core collections, so the server creates them at startup from Better Auth's schema. They match the [recommended indexes](https://www.better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index). This includes the unique index on `user.email`, which keeps concurrent sign-ups from creating duplicate accounts.
- Helmet sets security headers, and CORS only allows `CLIENT_ORIGIN`.
- Users can only read or change their own conversations. Any other conversation returns `404`.

## How replies are generated

When a message is sent, the server loads the last 20 messages of the conversation and sends them to OpenRouter with a system prompt. The prompt contains the support rules, the store policies and a demo set of orders from [`support-prompt.ts`](src/llm/support-prompt.ts), with dates relative to the current day. The [demo guide](../../docs/demo.md) lists the orders and conversations to try. If the configured model is unavailable, OpenRouter falls back to its free model router. The user message and the reply are saved together once the reply arrives, so a failed request doesn't leave a partial conversation.

## Project structure

```
src/
  auth/          Better Auth setup and the requireAuth middleware
  chat/          messages, conversation history, titles and pagination
  llm/           OpenRouter client and system prompt
  models/        Mongoose models for users, conversations and messages
  middleware/    rate limiting, request logging and error handling
  config/        environment, logger, MongoDB client and database setup
  scripts/       seed-admin script
  app.ts         Express app
  server.ts      entry point for Docker and local development
  vercel.ts      entry point for Vercel
```

## Deployment

- **Docker:** the [Dockerfile](Dockerfile) is built from the repository root so it can use the workspace lockfile. Bun installs the dependencies and Node runs `dist/server.js`. See [docker-compose.yml](../../docker-compose.yml).
- **Vercel:** the API is deployed together with the frontend as one project. The root [`api/index.js`](../../api/index.js) loads `dist/vercel.js`, which connects to MongoDB and passes each `/api` request to the Express app. See the [deployment guide](../../docs/deployment.md).

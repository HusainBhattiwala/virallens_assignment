# AI Customer Support Agent

A full-stack chat application where users talk to an AI customer support assistant. Users create an account, ask questions about orders, deliveries and returns, and can come back to their previous conversations at any time.

**Live demo:** https://virallens-assignment-8omx.vercel.app

## Features

- Sign up, log in and log out with JWT sessions stored in an httpOnly cookie
- Passwords hashed with bcrypt
- AI replies through OpenRouter, using the recent conversation as context
- Conversation history stored per user in MongoDB
- Typing indicator, and retry for messages that fail to send
- Rate limiting, with a stricter limit on login and signup
- Light and dark themes
- Docker Compose setup and Vercel deployment

## Tech stack

| Layer    | Tools                                                                            |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, SWR, React Router |
| Backend  | Node.js, Express 5, TypeScript, Mongoose, Zod, Pino                              |
| Database | MongoDB Atlas                                                                    |
| AI       | OpenRouter                                                                       |
| Tooling  | ESLint, Docker, Vercel                                                           |

## Getting started

### Prerequisites

- Node.js 22 or newer
- Bun 1.3 or newer, used as the package manager
- A MongoDB Atlas cluster (the free tier is enough)
- An OpenRouter API key

### Configuration

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

In `apps/server/.env`, set `MONGO_URI`, `JWT_SECRET` and `OPENROUTER_API_KEY`. You can generate a secret with `openssl rand -hex 32`. All variables are listed in the [server README](apps/server/README.md#environment-variables).

### Run with Docker

```bash
docker compose up --build
```

The app runs at http://localhost:8080 and the API at http://localhost:4000. MongoDB isn't part of the Compose setup. The server connects to the `MONGO_URI` in `apps/server/.env`, so allow your IP address in Atlas Network Access.

### Run locally

The repository is a Bun workspace. Install everything from the root, then start both apps:

```bash
bun install
bun run dev
```

The app runs at http://localhost:5173 and the API at http://localhost:4000.

To work on one app, filter by package name, for example `bun run --filter @support-agent/server dev`.

### Scripts

| Script          | Description                                  |
| --------------- | -------------------------------------------- |
| `bun run dev`   | Start the client and server in watch mode    |
| `bun run build` | Build both apps for production               |
| `bun run check` | Type check and lint both apps                |

## API

The API is versioned. All endpoints live under `/api/v1`, and the health check is at `/api/health`.

| Method | Endpoint                               | Auth | Description                          |
| ------ | -------------------------------------- | ---- | ------------------------------------ |
| POST   | `/api/v1/auth/signup`                  | No   | Create an account                    |
| POST   | `/api/v1/auth/login`                   | No   | Log in                               |
| POST   | `/api/v1/auth/logout`                  | No   | Log out                              |
| GET    | `/api/v1/auth/me`                      | Yes  | Get the current user                 |
| POST   | `/api/v1/chat/send`                    | Yes  | Send a message and get the AI reply  |
| GET    | `/api/v1/chat/history`                 | Yes  | List the user's conversations        |
| GET    | `/api/v1/chat/history/:conversationId` | Yes  | Get the messages of a conversation   |

Request and response formats are documented in the [server README](apps/server/README.md#api-reference). A [Postman collection](apps/server/postman/support-agent.postman_collection.json) is included for testing.

## Project structure

```
.
  apps/
    client/             React frontend (@support-agent/client)
    server/             Express API (@support-agent/server)
  package.json          Workspace definition and shared dependency versions
  bun.lock              Lockfile for the whole workspace
  docker-compose.yml    Runs the client and server together
  vercel.json           Vercel build and routing
  api/index.js          Vercel function entry, loads the compiled server
```

Dependencies shared by both apps, such as TypeScript, ESLint and Zod, are versioned once in the `catalog` of the root `package.json`.

## Deployment

The live demo runs on Vercel as a single project. [`vercel.json`](vercel.json) builds both apps, serves the frontend from `apps/client/dist` and sends every `/api/*` request to the Express app through [`api/index.js`](api/index.js). The frontend and the API share one domain, so the session cookie works without cross-site settings.

1. In MongoDB Atlas, allow access from `0.0.0.0/0` under Network Access, since Vercel doesn't use fixed IP addresses.
2. Import the repository in Vercel and keep the root directory as the repository root. The build settings come from `vercel.json`.
3. Add the environment variables below, then deploy.

| Variable             | Value                                           |
| -------------------- | ----------------------------------------------- |
| `MONGO_URI`          | Atlas connection string                         |
| `JWT_SECRET`         | Output of `openssl rand -hex 32`                |
| `OPENROUTER_API_KEY` | OpenRouter API key                              |
| `OPENROUTER_MODEL`   | Optional, defaults to `google/gemma-4-26b-a4b-it:free` |
| `NODE_ENV`           | `production`                                    |
| `COOKIE_SAME_SITE`   | `lax`                                           |
| `CLIENT_ORIGIN`      | The deployment URL, for example `https://your-app.vercel.app` |
| `VITE_API_URL`       | `/api/v1`                                       |

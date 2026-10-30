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
- A MongoDB Atlas cluster (the free tier is enough)
- An OpenRouter API key

### Configuration

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

In `server/.env`, set `MONGO_URI`, `JWT_SECRET` and `OPENROUTER_API_KEY`. You can generate a secret with `openssl rand -hex 32`. All variables are listed in the [server README](server/README.md#environment-variables).

### Run with Docker

```bash
docker compose up --build
```

The app runs at http://localhost:8080 and the API at http://localhost:4000. MongoDB isn't part of the Compose setup. The server connects to the `MONGO_URI` in `server/.env`, so allow your IP address in Atlas Network Access.

### Run locally

Start the API:

```bash
cd server
npm install
npm run dev
```

In a second terminal, start the frontend:

```bash
cd client
npm install
npm run dev
```

The app runs at http://localhost:5173 and the API at http://localhost:4000.

## API

| Method | Endpoint                        | Auth | Description                                   |
| ------ | ------------------------------- | ---- | --------------------------------------------- |
| POST   | `/auth/signup`                  | No   | Create an account                             |
| POST   | `/auth/login`                   | No   | Log in                                        |
| POST   | `/auth/logout`                  | No   | Log out                                       |
| GET    | `/auth/me`                      | Yes  | Get the current user                          |
| POST   | `/chat/send`                    | Yes  | Send a message and get the AI reply           |
| GET    | `/chat/history`                 | Yes  | List the user's conversations                 |
| GET    | `/chat/history/:conversationId` | Yes  | Get the messages of a conversation            |

Request and response formats are documented in the [server README](server/README.md#api-reference). A [Postman collection](server/postman/support-agent.postman_collection.json) is included for testing.

## Project structure

```
.
  client/               React frontend
  server/               Express API
  docker-compose.yml    Runs the client and server together
```

## Deployment

The live demo runs on Vercel as two projects from this repository: one with the root directory set to `server`, and one set to `client`. The client forwards `/api/*` requests to the server, which keeps the app and the API on a single domain so the session cookie works without cross-site settings.

1. In MongoDB Atlas, allow access from `0.0.0.0/0` under Network Access, since Vercel doesn't use fixed IP addresses.
2. Deploy the `server` directory. Add the variables from `server/.env.example`, with `NODE_ENV=production`.
3. Set the server URL as the `/api/:path*` destination in [`client/vercel.json`](client/vercel.json).
4. Deploy the `client` directory with the Vite preset and `VITE_API_URL=/api`.
5. Set `CLIENT_ORIGIN` on the server to the client URL and redeploy the server.

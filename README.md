# AI Customer Support Agent

A full-stack customer support chat powered by AI. Users create an account, ask about their orders, deliveries and returns, and can pick up any past conversation where they left off.

**[Live demo](https://virallensassignment.vercel.app/)** · [Demo guide](docs/demo.md)

## Features

- Chat with an AI support assistant that keeps the context of the conversation
- Conversation history with AI-generated titles, plus rename, delete and search
- Past conversations load as you scroll
- Email and password accounts with [Better Auth](https://www.better-auth.com): httpOnly cookie sessions, encrypted short-lived session cache, rate limiting and admin user management with bans
- retry for messages that fail to send

## Tech stack

| Layer    | Tools                                                                            |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, SWR, React Router |
| Backend  | Node.js, Express 5, TypeScript, Better Auth, Mongoose, Zod, Pino                 |
| Database | MongoDB Atlas                                                                    |
| AI       | OpenRouter                                                                       |
| Tooling  | Bun workspaces, ESLint, Docker, Vercel                                           |

## Getting started

You need [Bun](https://bun.sh) 1.3 or newer, Node.js 22 or newer, a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (the free tier is enough) and an [OpenRouter](https://openrouter.ai) API key.

```bash
git clone https://github.com/HusainBhattiwala/virallens_assignment.git
cd virallens_assignment
bun install
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

In `apps/server/.env`, set `MONGO_URI`, `BETTER_AUTH_SECRET`, `OPENROUTER_API_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. You can generate a secret with `openssl rand -hex 32`. Then create the admin account and start the app:

```bash
bun run --filter @support-agent/server build
bun run --filter @support-agent/server seed:admin
bun run dev
```

Open http://localhost:5173.

To run it with Docker instead, fill in `apps/server/.env` and run `docker compose up --build`. The app is then at http://localhost:8080.

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `bun run dev`   | Start the client and server in watch mode |
| `bun run build` | Build both apps                           |
| `bun run check` | Type check and lint both apps             |
| `bun run test`  | Run the client and server tests           |

The tests run with [Vitest](https://vitest.dev). The root `vitest.config.ts` treats each app as a [project](https://vitest.dev/guide/projects), so one command runs both apps' tests with each app's own config. Use `bun run test`, not `bun test`, because `bun test` starts Bun's own test runner instead of Vitest.

## Documentation

- [Server](apps/server/README.md): API reference, environment variables and how replies are generated
- [Client](apps/client/README.md): routes, state management and project structure
- [Demo guide](docs/demo.md): demo orders and prompts for testing the assistant
- [Deployment](docs/deployment.md): Docker Compose and Vercel
- [Postman collection](apps/server/postman/support-agent.postman_collection.json) for testing the API

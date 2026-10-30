# AI Customer Support Agent

A full-stack customer support chat powered by AI. Users create an account, ask about their orders, deliveries and returns, and can pick up any past conversation where they left off.

**[Live demo](https://virallens-assignment-8omx.vercel.app)**

## Features

- Chat with an AI support assistant that keeps the context of the conversation
- Conversation history with AI-generated titles, plus rename, delete and search
- Past conversations load as you scroll
- Email and password accounts with secure cookie sessions
- Typing indicator, and retry for messages that fail to send
- Tokyo Night light and dark themes, on desktop and mobile

## Tech stack

| Layer    | Tools                                                                            |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, SWR, React Router |
| Backend  | Node.js, Express 5, TypeScript, Mongoose, Zod, Pino                              |
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

In `apps/server/.env`, set `MONGO_URI`, `JWT_SECRET` and `OPENROUTER_API_KEY`. You can generate a secret with `openssl rand -hex 32`. Then start the app:

```bash
bun run dev
```

Open http://localhost:5173.

To run it with Docker instead, fill in `apps/server/.env` and run `docker compose up --build`. The app is then at http://localhost:8080.

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `bun run dev`   | Start the client and server in watch mode |
| `bun run build` | Build both apps                           |
| `bun run check` | Type check and lint both apps             |

## Documentation

- [Server](apps/server/README.md): API reference, environment variables and how replies are generated
- [Client](apps/client/README.md): routes, state management and project structure
- [Deployment](docs/deployment.md): Docker Compose and Vercel
- [Postman collection](apps/server/postman/support-agent.postman_collection.json) for testing the API

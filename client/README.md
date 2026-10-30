# Client

React frontend for the AI Customer Support Agent. It includes signup and login, the chat interface and a sidebar with past conversations.

## Setup

The [server](../server/README.md) needs to be running first.

```bash
cp .env.example .env
bun install
bun run dev
```

Run these from the `client` directory. `bun install` installs the whole workspace from the root lockfile.

The app runs at http://localhost:5173.

## Environment variables

| Variable       | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | Base URL of the API. Use `http://localhost:4000/api/v1` for local development and `/api/v1` for Docker and Vercel |

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `bun run dev`     | Start the development server         |
| `bun run build`   | Type check and build for production  |
| `bun run preview` | Preview the production build         |
| `bun run check`   | Type check and lint                  |
| `bun run format`  | Format the code with Prettier        |

## Routes

| Path                    | Access    | Page                    |
| ----------------------- | --------- | ----------------------- |
| `/login`, `/signup`     | Guests    | Login and signup forms  |
| `/chat`                 | Logged in | New conversation        |
| `/chat/:conversationId` | Logged in | Existing conversation   |

## State and data fetching

- Zustand stores the session and messages that are still being sent.
- SWR fetches and caches conversations and messages.
- All requests go through `src/lib/api.ts`, which sends the session cookie and validates responses with Zod. A `401` from any request logs the user out.

## Project structure

```
src/
  features/auth/    API calls, store, forms, route guards and user menu
  features/chat/    API calls, store, sidebar, message list and composer
  components/       shared components; components/ui contains shadcn/ui
  lib/              API client and helpers
  App.tsx           routes
  main.tsx          entry point
  index.css         Tailwind setup and theme colors
```

## Deployment

- **Docker:** the [Dockerfile](Dockerfile) is built from the repository root, installs the workspace with Bun, builds the app and serves it with nginx. [nginx.conf](nginx.conf) forwards `/api` requests to the server container unchanged.
- **Vercel:** the frontend is deployed together with the API as one project. The root [`vercel.json`](../vercel.json) serves `client/dist`, sends `/api/*` to the API function and falls back to `index.html` for other routes. See the [root README](../README.md#deployment).

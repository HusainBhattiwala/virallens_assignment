# Client

React frontend for the AI Customer Support Agent. It includes signup and login, the chat interface and a sidebar with past conversations.

## Setup

The [server](../server/README.md) needs to be running first.

```bash
cp .env.example .env
bun install
bun run dev
```

Run these from `apps/client`. `bun install` installs the whole workspace from the root lockfile. From the repository root, the same scripts run with `bun run --filter @support-agent/client <script>`.

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
- SWR fetches and caches conversations and messages. The sidebar uses `useSWRInfinite` to load the next page of conversations when the end of the list scrolls into view, using the cursor returned by the API.
- Conversation search is debounced by 300 ms and keeps the previous results on screen while the next ones load.
- After a new conversation's first reply, the client asks the API for a generated title and updates the sidebar and header.
- Your messages can be edited in place from the pencil button that appears on hover. Enter sends, Shift + Enter adds a new line and Escape cancels. While the edit is sent, the messages after it are hidden and the reply indicator shows. If it fails, the conversation is reloaded and the edit can be retried or discarded. Retry is hidden when the edited message no longer exists. The composer can't send while an edit is open or a failed edit is unresolved, so a draft is never lost.
- Sign up, log in, log out and session checks use the [Better Auth](https://www.better-auth.com) client in `src/features/auth/auth-api.ts`. The session lives in httpOnly cookies, so the client never reads or stores tokens, and the server refreshes them.
- Chat requests go through `src/lib/api.ts`, which sends the session cookie and validates responses with Zod. A `401` from any request logs the user out.

## Project structure

```
src/
  features/auth/    API calls, store, forms, route guards and user menu
  features/chat/    API calls, store, sidebar, conversation list and dialogs, message list and composer
  hooks/            shared hooks such as debouncing and infinite scroll
  components/       shared components; components/ui contains shadcn/ui
  lib/              API client and helpers
  App.tsx           routes
  main.tsx          entry point
  index.css         Tailwind setup and theme colors
```

## Deployment

- **Docker:** the [Dockerfile](Dockerfile) is built from the repository root, installs the workspace with Bun, builds the app and serves it with nginx. [nginx.conf](nginx.conf) forwards `/api` requests to the server container unchanged.
- **Vercel:** the frontend is deployed together with the API as one project. The root [`vercel.json`](../../vercel.json) serves `apps/client/dist`, sends `/api/*` to the API function and falls back to `index.html` for other routes. See the [deployment guide](../../docs/deployment.md).

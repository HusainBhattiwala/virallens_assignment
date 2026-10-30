# Harbor client

Web app for the Harbor support chat: signup, login, the AI chat and conversation history.

**Stack:** React 19, Vite 8, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), Zustand, SWR, React Router 8, zod.

## Setup

Requires Node.js 22 or newer and the [server](../server/README.md) running.

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs on http://localhost:5173.

## Environment variables

| Variable       | Required | Description                                                          |
| -------------- | -------- | -------------------------------------------------------------------- |
| `VITE_API_URL` | Yes      | API base URL: `http://localhost:4000` locally, `/api` in Docker      |

The value is built into the app. If it's missing, the app stops with an error at startup.

## Scripts

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Dev server on port 5173                  |
| `npm run build`   | Type check and production build          |
| `npm run preview` | Serve the production build               |
| `npm run check`   | Type check and lint                      |
| `npm run format`  | Format with Prettier                     |

## Structure

```
src/
  main.tsx              providers, session restore
  App.tsx               routes, lazy-loaded pages
  lib/api.ts            fetch wrapper with cookies, typed errors, zod-checked responses
  features/auth/        auth API, store, schemas, route guards, auth page, user menu
  features/chat/        chat API, SWR hooks, store, sidebar, conversation view, composer
  components/           brand mark, page status, theme provider
  components/ui/        shadcn/ui components (generated)
  index.css             Tailwind entry and design tokens (light and dark)
```

Imports outside the current folder use `@/`.

## How it works

### Routes

| Path                    | Access       | Page                       |
| ----------------------- | ------------ | -------------------------- |
| `/login`, `/signup`     | Guests only  | Auth forms                 |
| `/chat`                 | Logged in    | New conversation           |
| `/chat/:conversationId` | Logged in    | Existing conversation      |

Other paths redirect to `/chat`.

### State
- **Zustand** holds client state:
  - `auth-store`: the session.
  - `chat-store`: messages being sent, tracked per conversation.
- **SWR** caches the conversation list and messages, and updates them after each send.
- **`lib/api.ts`** sends cookies and validates every response with zod. Any 401 clears the session and the cache, then shows a toast.

### Chat
- Your message appears immediately, and a typing indicator shows while the reply is generated. Screen readers announce it.
- Failed messages show the reason and a Retry button.
- Enter sends; Shift+Enter adds a new line.
- New conversations offer suggested questions.
- On mobile, the sidebar becomes a slide-over panel.

### Logout
- The menu shows a spinner while logging out.
- Cached data and unsent messages are cleared.
- A confirmation toast appears and you land on the login page.

### UI
- Built with shadcn/ui components only.
- Colours and type are tokens in `src/index.css`, with light and dark themes.
- The theme follows the system setting and can be changed in the user menu.

## Docker

The [`Dockerfile`](Dockerfile) builds the app with `VITE_API_URL=/api` and serves it with nginx ([`nginx.conf`](nginx.conf)). nginx:
- Falls back to `index.html` for client-side routes.
- Proxies `/api/*` to the server, so the app and the API share one origin.
- Caches hashed assets long-term.

Through the root [`docker-compose.yml`](../docker-compose.yml), the app is served on http://localhost:8080.

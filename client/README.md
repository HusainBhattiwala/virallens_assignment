# Client

React frontend for the AI Customer Support Agent. It includes signup and login, the chat interface and a sidebar with past conversations.

## Setup

The [server](../server/README.md) needs to be running first.

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Environment variables

| Variable       | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | Base URL of the API. Use `http://localhost:4000` for local development and `/api` for Docker and Vercel |

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Type check and build for production  |
| `npm run preview` | Preview the production build         |
| `npm run check`   | Type check and lint                  |
| `npm run format`  | Format the code with Prettier        |

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

- **Docker:** the [Dockerfile](Dockerfile) builds the app and serves it with nginx. [nginx.conf](nginx.conf) forwards `/api` to the server container.
- **Vercel:** [vercel.json](vercel.json) forwards `/api/*` to the deployed server and serves `index.html` for all other routes.

# Harbor: AI Customer Support Agent

A full-stack support chat. Users sign up, ask an AI assistant about orders, deliveries, returns and their account, and reopen past conversations later. Conversations are stored in MongoDB per user.

| Part                | Stack                                                                 | Docs                                     |
| ------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| [`client/`](client) | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, SWR   | [client/README.md](client/README.md)     |
| [`server/`](server) | Node.js 22, Express 5, TypeScript, MongoDB (Mongoose), JWT, bcrypt    | [server/README.md](server/README.md)     |
| AI                  | [OpenRouter](https://openrouter.ai) via `@openrouter/sdk`             | [AI replies](server/README.md#ai-replies) |

## Features

- **Auth:** signup, login and logout with JWT. Passwords are hashed with bcrypt. The session is an `httpOnly` cookie, and chat routes require it.
- **Chat:** AI replies, history saved per user, past conversations in a sidebar.
- **AI:** OpenRouter with a support-agent prompt. It receives the last 20 messages as context and falls back to a free model when the chosen one is busy.
- **Typing indicator:** shown while a reply is generated. Failed messages offer a retry.
- **Rate limiting:** 100 requests per 15 minutes per IP, and 20 for login and signup.
- **Environment configs:** `NODE_ENV` switches logging and error detail. The cookie is `Secure` automatically over HTTPS.
- **Docker:** `docker compose up` runs the client and server. The database is MongoDB Atlas.

## Architecture

```
Browser --> client container (nginx, :8080)
              /        React app
              /api/*   --> server container (Express, :4000) --> MongoDB Atlas
                                                             --> OpenRouter
```

In Docker, nginx serves the app and the API from one origin. In development the client (`:5173`) calls the server (`:4000`) directly, and CORS allows that origin.

## Run with Docker

Requires Docker Compose v2, a MongoDB Atlas connection string and an OpenRouter API key.

```bash
cp server/.env.example server/.env
docker compose up --build
```

Before starting, set `MONGO_URI`, `JWT_SECRET` (`openssl rand -hex 32`) and `OPENROUTER_API_KEY` in `server/.env`.

- App: http://localhost:8080
- API: http://localhost:4000, for the [Postman collection](server/postman/support-agent.postman_collection.json)

Stop with `docker compose down`.

## Run locally

Requires Node.js 22 or newer.

```bash
cd server && cp .env.example .env && npm install && npm run dev
cd client && cp .env.example .env && npm install && npm run dev
```

The API runs on http://localhost:4000 and the app on http://localhost:5173.

Both projects have the same scripts:

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Start in watch mode        |
| `npm run build`     | Production build           |
| `npm run check`     | Type check and lint        |

## API

| Method | Path                            | Auth | Purpose                                 |
| ------ | ------------------------------- | ---- | --------------------------------------- |
| POST   | `/auth/signup`                  | No   | Create an account and start a session   |
| POST   | `/auth/login`                   | No   | Start a session                         |
| POST   | `/auth/logout`                  | No   | End the session                         |
| GET    | `/auth/me`                      | Yes  | Current user                            |
| POST   | `/chat/send`                    | Yes  | Send a message and get the AI reply     |
| GET    | `/chat/history`                 | Yes  | List conversations                      |
| GET    | `/chat/history/:conversationId` | Yes  | List messages in a conversation         |

Details are in the [server README](server/README.md#api).

## Design decisions

- **Cookie session, not localStorage.** Scripts can't read the token. The cookie is `SameSite=Lax` and becomes `Secure` behind HTTPS.
- **Nothing is saved when the AI fails.** The message and the reply are stored together, only after the model answers.
- **Validation at every boundary.** zod checks requests on the server and responses on the client.
- **State split.** Zustand holds client state (session, messages being sent). SWR caches server data.

## Deploy to Vercel

The app is deployed as two Vercel projects from this repository. The client forwards `/api/*` to the server, so the browser sees one origin and the session cookie stays first-party.

| Project | Root directory | Config                                   |
| ------- | -------------- | ---------------------------------------- |
| Server  | `server`       | [`server/vercel.json`](server/vercel.json) |
| Client  | `client`       | [`client/vercel.json`](client/vercel.json) |

1. **MongoDB Atlas:** under Network Access, allow `0.0.0.0/0`. Vercel functions don't have fixed IP addresses.
2. **Server project:**
   - Import the repository in Vercel and set the root directory to `server`. Leave the build settings to `vercel.json`.
   - Add these environment variables:
     - `MONGO_URI`, `JWT_SECRET` and `OPENROUTER_API_KEY`.
     - `OPENROUTER_MODEL`.
     - `NODE_ENV=production` and `COOKIE_SAME_SITE=lax`.
     - `CLIENT_ORIGIN`: use a placeholder until step 5.
   - Deploy, then note the URL, for example `https://harbor-api.vercel.app`.
3. **Point the client at the server:** in [`client/vercel.json`](client/vercel.json), replace `YOUR-SERVER-PROJECT.vercel.app` with the server's domain. Commit and push.
4. **Client project:** import the same repository with root directory `client` and framework preset Vite. Add `VITE_API_URL=/api` and deploy.
5. **Finish:** set the server's `CLIENT_ORIGIN` to the client URL and redeploy the server.

Check it by opening `https://<client>.vercel.app/api/health`, which should return `{"status":"ok"}`. Then sign up in the app.

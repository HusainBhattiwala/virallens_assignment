# Deployment

The app can run with Docker Compose on any machine, or on Vercel as a single project. Both use MongoDB Atlas, which isn't part of either setup.

## Docker Compose

```bash
cp apps/server/.env.example apps/server/.env
docker compose up --build
```

| Service  | URL                   | Image                                            |
| -------- | --------------------- | ------------------------------------------------ |
| `client` | http://localhost:8080 | nginx serving the built frontend                 |
| `server` | http://localhost:4000 | Node.js running the compiled API                 |

The server reads `apps/server/.env`. Compose overrides `NODE_ENV`, `PORT`, `CLIENT_ORIGIN` and `BETTER_AUTH_URL`, so only `MONGO_URI`, `BETTER_AUTH_SECRET`, `OPENROUTER_API_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` need to be set. Allow your IP address under Network Access in Atlas.

Create the admin account once the containers are running:

```bash
docker compose run --rm server node dist/scripts/seed-admin.js
```

nginx forwards `/api` to the server container, so the browser talks to a single origin and the session cookies work without cross-site settings. Serve the frontend and the API from the same site in any other setup too. The session cookies are `SameSite=Lax`, and Better Auth [recommends a reverse proxy](https://www.better-auth.com/docs/concepts/cookies#safari-itp-and-cross-domain-setups) over cross-site cookies, which Safari blocks. nginx overwrites `X-Forwarded-For` with the client address, so Better Auth's rate limiter sees the real IP and clients can't spoof it. The client container waits for the server's health check before starting.

### How the images are built

Both Dockerfiles use the repository root as the build context, because a Bun workspace has one lockfile at the root.

1. Copy the root `package.json`, `bun.lock` and the `package.json` of every app. `bun install --frozen-lockfile` needs all workspace manifests to match the lockfile.
2. Install only the app being built with `bun install --filter`. The Bun download cache is kept in a BuildKit cache mount, so rebuilds don't download packages again.
3. Copy that app's source and build it.

The server image installs production dependencies in a separate stage with `--production` and copies them next to the compiled `dist/`, so TypeScript, ESLint and other dev tools aren't shipped. It runs as the `node` user. The client image only contains nginx and the static files.

## Vercel

The live demo runs on Vercel as one project. [`vercel.json`](../vercel.json) installs the workspace with Bun, builds both apps, serves the frontend from `apps/client/dist` and sends every `/api/*` request to the Express app through [`api/index.js`](../api/index.js).

1. In MongoDB Atlas, allow access from `0.0.0.0/0` under Network Access, since Vercel doesn't use fixed IP addresses.
2. Import the repository in Vercel and keep the root directory as the repository root. The build settings come from `vercel.json`.
3. Add the environment variables below for every environment that deploys, then deploy.

| Variable             | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| `MONGO_URI`          | Atlas connection string                                       |
| `BETTER_AUTH_SECRET` | Output of `openssl rand -hex 32`. Signs and encrypts the session cookies |
| `BETTER_AUTH_URL`    | The deployment URL, the same value as `CLIENT_ORIGIN`         |
| `ADMIN_EMAIL`        | Email of the admin account                                    |
| `ADMIN_PASSWORD`     | Password of the admin account, at least 8 characters. Mark it as sensitive |
| `OPENROUTER_API_KEY` | OpenRouter API key                                            |
| `OPENROUTER_MODEL`   | Optional, defaults to `google/gemma-4-26b-a4b-it:free`        |
| `NODE_ENV`           | `production`                                                  |
| `CLIENT_ORIGIN`      | The deployment URL, for example `https://your-app.vercel.app` |
| `VITE_API_URL`       | `/api/v1`                                                     |

The root [`.env.example`](../.env.example) lists the same variables.

### Admin account

The build command in `vercel.json` runs `seed:admin` after building. The script reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` and the optional `ADMIN_NAME`, and creates the admin through Better Auth's `auth.api.createUser`, the same path the official `auth create-admin` CLI uses. The password is hashed with scrypt, and the account goes into the `user` and `account` collections.

The script is safe to run on every deploy:

- If the admin already exists, it logs that and exits successfully. It doesn't change an existing password, so rotate it from the admin's own session.
- Better Auth's `createUser` writes the user and the password credential separately. If a run stopped between the two, the next run links the password from `ADMIN_PASSWORD`. A unique index on `account.providerId` + `account.accountId` makes sure parallel runs can't link two credentials.
- If two deploys seed at the same time, MongoDB's unique index on `user.email` lets only one insert succeed, and the other run finds the admin and exits successfully.
- If `ADMIN_EMAIL` belongs to an account without the admin role, the script fails the build instead of promoting that account. Otherwise anyone who signed up with that email first would become an admin.

### Moving from the old JWT auth

Better Auth keeps users in the `user`, `account` and `session` collections. The old `users` collection and the conversations and messages that belonged to those users aren't used anymore. To remove them, run this once in `mongosh` against the app's database. It only deletes data owned by the old users, so it's safe to run after new users have started chatting:

```js
const legacyUserIds = db.users.distinct("_id")
const legacyConversationIds = db.conversations.distinct("_id", { user: { $in: legacyUserIds } })
db.messages.deleteMany({ conversation: { $in: legacyConversationIds } })
db.conversations.deleteMany({ _id: { $in: legacyConversationIds } })
db.users.drop()
```

`JWT_SECRET` and `COOKIE_SAME_SITE` are no longer read and can be deleted from the Vercel project.

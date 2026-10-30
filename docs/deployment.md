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

The server reads `apps/server/.env`. Compose overrides `NODE_ENV`, `PORT` and `CLIENT_ORIGIN`, so only `MONGO_URI`, `JWT_SECRET` and `OPENROUTER_API_KEY` need to be set. Allow your IP address under Network Access in Atlas.

nginx forwards `/api` to the server container, so the browser talks to a single origin and the session cookie works without cross-site settings. The client container waits for the server's health check before starting.

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
3. Add the environment variables below, then deploy.

| Variable             | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| `MONGO_URI`          | Atlas connection string                                       |
| `JWT_SECRET`         | Output of `openssl rand -hex 32`                              |
| `OPENROUTER_API_KEY` | OpenRouter API key                                            |
| `OPENROUTER_MODEL`   | Optional, defaults to `google/gemma-4-26b-a4b-it:free`        |
| `NODE_ENV`           | `production`                                                  |
| `COOKIE_SAME_SITE`   | `lax`                                                         |
| `CLIENT_ORIGIN`      | The deployment URL, for example `https://your-app.vercel.app` |
| `VITE_API_URL`       | `/api/v1`                                                     |

The root [`.env.example`](../.env.example) lists the same variables.

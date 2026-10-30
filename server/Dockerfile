FROM node:22-alpine AS base
COPY --from=oven/bun:1.3.1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY client/package.json client/
COPY server/package.json server/

FROM base AS build
RUN bun install --frozen-lockfile --filter @support-agent/server
COPY server server
RUN bun run --filter @support-agent/server build

FROM base AS production-deps
RUN bun install --frozen-lockfile --production --filter @support-agent/server

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules node_modules
COPY --from=production-deps /app/server/node_modules server/node_modules
COPY --from=build /app/server/dist server/dist
COPY server/package.json server/
WORKDIR /app/server
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]

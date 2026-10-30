FROM node:22-alpine AS base
COPY --from=oven/bun:1.3.1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/

FROM base AS build
RUN bun install --frozen-lockfile --filter @support-agent/server
COPY apps/server apps/server
RUN bun run --filter @support-agent/server build

FROM base AS production-deps
RUN bun install --frozen-lockfile --production --filter @support-agent/server

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules node_modules
COPY --from=production-deps /app/apps/server/node_modules apps/server/node_modules
COPY --from=build /app/apps/server/dist apps/server/dist
COPY apps/server/package.json apps/server/
WORKDIR /app/apps/server
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]

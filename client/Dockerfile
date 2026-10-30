FROM node:22-alpine AS build
COPY --from=oven/bun:1.3.1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY client/package.json client/
COPY server/package.json server/
RUN bun install --frozen-lockfile --filter @support-agent/client
COPY client client
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN bun run --filter @support-agent/client build

FROM nginx:1.29-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80

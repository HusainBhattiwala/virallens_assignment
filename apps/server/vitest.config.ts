import { resolve } from "node:path";
import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "server",
    environment: "node",
    globalSetup: ["./src/test/global-setup.ts"],
    setupFiles: ["./src/test/setup.ts"],
    hookTimeout: 60_000,
    mockReset: true,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      CLIENT_ORIGIN: "http://localhost:5173",
      BETTER_AUTH_URL: "http://localhost:4000",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
      OPENROUTER_API_KEY: "test-key",
    },
  },
});

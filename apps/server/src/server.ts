import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "@/config/database.js";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";

const { PORT } = env;

try {
  await connectDatabase();
  logger.info("Connected to MongoDB");
} catch (err) {
  logger.fatal({ err }, "Failed to connect to MongoDB");
  process.exit(1);
}

const server = createApp().listen(PORT, () => {
  logger.info(`Server listening on port ${String(PORT)}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info(`${signal} received, shutting down`);
  server.close(() => {
    void disconnectDatabase().then(() => process.exit(0));
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

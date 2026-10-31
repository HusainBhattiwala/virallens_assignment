import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { auth } from "@/auth/auth.js";
import { chatRouter } from "@/chat/chat.routes.js";
import { API_V1_PREFIX, AUTH_PREFIX, HEALTH_CHECK_PATH } from "@/config/api-paths.js";
import { env } from "@/config/env.js";
import { errorHandler, notFound } from "@/middleware/error-handler.js";
import { apiRateLimiter } from "@/middleware/rate-limit.js";
import { requestLogger } from "@/middleware/request-logger.js";

const { CLIENT_ORIGIN } = env;

export const createApp = (): Express => {
  const app = express();

  app.set("trust proxy", 1);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
  app.use(apiRateLimiter);
  app.all(`${AUTH_PREFIX}/*splat`, toNodeHandler(auth));
  app.use(express.json({ limit: "100kb" }));

  app.get(HEALTH_CHECK_PATH, (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use(`${API_V1_PREFIX}/chat`, chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

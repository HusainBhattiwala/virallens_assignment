import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { authRouter } from "@/auth/auth.routes.js";
import { chatRouter } from "@/chat/chat.routes.js";
import { env } from "@/config/env.js";
import { errorHandler, notFound } from "@/middleware/error-handler.js";
import { requestLogger } from "@/middleware/request-logger.js";

const { CLIENT_ORIGIN } = env;

export const createApp = (): Express => {
  const app = express();

  app.set("trust proxy", 1);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/auth", authRouter);
  app.use("/chat", chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

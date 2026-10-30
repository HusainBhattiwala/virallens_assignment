import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { isHttpError } from "http-errors";
import { pinoHttp } from "pino-http";
import { logger } from "@/config/logger.js";

const HEALTH_CHECK_PATH = "/health";

const describeRequest = (req: Request, res: Response): string =>
  `${req.method} ${req.originalUrl} ${String(res.statusCode)}`;

const describeError = (error: Error): string =>
  error.cause instanceof Error ? `${error.message} (${error.cause.name}: ${error.cause.message})` : error.message;

interface ErrorDetails {
  err?: Error;
  upstream?: string;
}

const toErrorDetails = (error: Error): ErrorDetails => {
  if (!isHttpError(error)) return { err: error };
  return typeof error.upstream === "string" ? { upstream: error.upstream } : {};
};

export const requestLogger = pinoHttp<Request, Response>({
  logger,
  quietReqLogger: true,
  quietResLogger: true,
  autoLogging: { ignore: (req) => req.url === HEALTH_CHECK_PATH },
  genReqId: (req, res) => {
    const id = req.headers["x-request-id"]?.toString() ?? randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${describeRequest(req, res)} ${String(Math.round(responseTime))}ms`,
  customErrorMessage: (req, res, error) => `${describeRequest(req, res)} ${describeError(error)}`,
  customSuccessObject: (req) => ({ userId: req.userId }),
  customErrorObject: (req, _res, error) => ({ userId: req.userId, ...toErrorDetails(error) }),
});

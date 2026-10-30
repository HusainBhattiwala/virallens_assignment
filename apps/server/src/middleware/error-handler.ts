import type { ErrorRequestHandler, RequestHandler } from "express";
import createHttpError, { isHttpError } from "http-errors";
import { z } from "zod";
import { isProduction } from "@/config/env.js";
import { toError } from "@/lib/errors.js";

const INTERNAL_ERROR_MESSAGE = "Internal server error";

export const notFound: RequestHandler = (req, _res, next) => {
  next(createHttpError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const error = toError(err);

  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(error) });
    return;
  }

  const status = isHttpError(error) ? error.status : 500;
  const isExposed = isHttpError(error) && error.expose;

  if (status >= 500) res.err = error;
  res.status(status).json({ error: isExposed || !isProduction ? error.message : INTERNAL_ERROR_MESSAGE });
};

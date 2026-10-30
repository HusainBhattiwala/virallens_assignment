import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

const createRateLimiter = (limit: number): RateLimitRequestHandler =>
  rateLimit({ windowMs: WINDOW_MS, limit, standardHeaders: "draft-8", legacyHeaders: false });

export const apiRateLimiter = createRateLimiter(100);
export const credentialsRateLimiter = createRateLimiter(20);

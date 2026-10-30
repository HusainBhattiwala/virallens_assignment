import type { CookieOptions, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import { SESSION_COOKIE, sessionCookiesSchema } from "./auth.schema.js";

const { JWT_SECRET, COOKIE_SAME_SITE } = env;
const JWT_ALGORITHM = "HS256";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const cookieOptionsFor = (res: Response): CookieOptions => ({
  httpOnly: true,
  secure: res.req.secure,
  sameSite: COOKIE_SAME_SITE,
  path: "/",
});

const unauthenticated = (): Error => createHttpError(401, "Not authenticated");

const readUserId = (token: string): string | undefined => {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    return typeof payload === "string" ? undefined : payload.sub;
  } catch {
    return undefined;
  }
};

export const startSession = (res: Response, userId: string): void => {
  const token = jwt.sign({}, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    subject: userId,
    expiresIn: SESSION_TTL_SECONDS,
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptionsFor(res), maxAge: SESSION_TTL_SECONDS * 1000 });
};

export const endSession = (res: Response): void => {
  res.clearCookie(SESSION_COOKIE, cookieOptionsFor(res));
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = sessionCookiesSchema.safeParse(req.cookies).data?.[SESSION_COOKIE];
  const userId = token ? readUserId(token) : undefined;
  if (!userId) throw unauthenticated();

  req.userId = userId;
  next();
};

export const getUserId = (req: Request): string => {
  if (!req.userId) throw unauthenticated();
  return req.userId;
};

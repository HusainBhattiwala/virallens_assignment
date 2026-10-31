import { fromNodeHeaders } from "better-auth/node";
import type { Request, RequestHandler } from "express";
import createHttpError from "http-errors";
import { auth, type AuthUser } from "./auth.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const unauthenticated = (): Error => createHttpError(401, "Not authenticated");

const assertTrustedOrigin = async (req: Request): Promise<void> => {
  const origin = req.get("origin") ?? req.get("referer");
  const context = await auth.$context;
  if (!origin || !context.isTrustedOrigin(origin)) throw createHttpError(403, "Untrusted origin");
};

const isBanned = ({ banned, banExpires }: AuthUser): boolean =>
  banned === true && (!banExpires || new Date(banExpires).getTime() > Date.now());

export const requireAuth: RequestHandler = async (req, res, next) => {
  const isSafeMethod = SAFE_METHODS.has(req.method);
  if (!isSafeMethod) await assertTrustedOrigin(req);

  const { headers, response: session } = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
    query: { disableCookieCache: !isSafeMethod },
    returnHeaders: true,
  });

  const cookies = headers.getSetCookie();
  if (cookies.length > 0) res.append("Set-Cookie", cookies);
  if (!session || isBanned(session.user)) throw unauthenticated();

  req.user = session.user;
  next();
};

export const getUser = (req: Request): AuthUser => {
  if (!req.user) throw unauthenticated();
  return req.user;
};

import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { loginSchema, signupSchema } from "./auth.schema.js";
import { findUser, login, signup } from "./auth.service.js";
import { endSession, getUserId, requireAuth, startSession } from "./session.js";

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post("/signup", credentialsLimiter, async (req, res) => {
  const user = await signup(signupSchema.parse(req.body));
  startSession(res, user.id);
  res.status(201).json({ user });
});

authRouter.post("/login", credentialsLimiter, async (req, res) => {
  const user = await login(loginSchema.parse(req.body));
  startSession(res, user.id);
  res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
  endSession(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: await findUser(getUserId(req)) });
});

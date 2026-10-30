import { z } from "zod";

export const SESSION_COOKIE = "session";

const email = z.string().trim().toLowerCase().pipe(z.email());

export const signupSchema = z.object({
  email,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const sessionCookiesSchema = z.object({
  [SESSION_COOKIE]: z.string().min(1),
});

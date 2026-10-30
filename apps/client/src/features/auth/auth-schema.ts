import { z } from "zod"

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"))

export const signupSchema = z.object({
  email,
  password: z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer"),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
})

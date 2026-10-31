import request from "supertest";
import { createApp } from "@/app.js";
import { env } from "@/config/env.js";

const app = createApp();

export const PASSWORD = "correct-horse-battery";

export const anonymous = () => request(app);

export const signUp = async (email: string) => {
  const agent = request.agent(app).set("Origin", env.CLIENT_ORIGIN);
  await agent.post("/api/v1/auth/sign-up/email").send({ email, password: PASSWORD, name: email }).expect(200);
  return agent;
};

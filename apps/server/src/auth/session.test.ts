import { describe, it } from "vitest";
import { env } from "@/config/env.js";
import { mongoClient } from "@/config/mongo-client.js";
import { anonymous, PASSWORD, signUp } from "@/test/agent.js";

const EMAIL = "jane@example.com";

describe("requireAuth", () => {
  it("rejects chat requests without a session", async () => {
    await anonymous().get("/api/v1/chat/history").expect(401);
    await anonymous().post("/api/v1/chat/send").set("Origin", env.CLIENT_ORIGIN).send({ message: "Hi" }).expect(401);
  });

  it("rejects writes from an untrusted origin even with a valid session", async () => {
    const agent = await signUp(EMAIL);

    await agent.post("/api/v1/chat/send").set("Origin", "https://evil.example").send({ message: "Hi" }).expect(403);
  });

  it("ends access after logout and restores it after logging back in", async () => {
    const agent = await signUp(EMAIL);
    await agent.get("/api/v1/chat/history").expect(200);

    await agent.post("/api/v1/auth/sign-out").expect(200);
    await agent.get("/api/v1/chat/history").expect(401);

    await agent.post("/api/v1/auth/sign-in/email").send({ email: EMAIL, password: PASSWORD }).expect(200);
    await agent.get("/api/v1/chat/history").expect(200);
  });

  it("rejects a banned user", async () => {
    const agent = await signUp(EMAIL);
    await mongoClient.db().collection("user").updateOne({ email: EMAIL }, { $set: { banned: true } });

    await agent.post("/api/v1/chat/send").send({ message: "Hi" }).expect(401);
  });
});

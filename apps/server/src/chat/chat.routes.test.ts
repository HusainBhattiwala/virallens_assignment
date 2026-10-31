import createHttpError from "http-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateReply } from "@/llm/openrouter.js";
import { signUp } from "@/test/agent.js";
import type { ConversationDetailResponse, ConversationPageResponse } from "./chat.service.js";

vi.mock("@/llm/openrouter.js", () => ({ generateReply: vi.fn(), generateTitle: vi.fn() }));

const EMAIL = "jane@example.com";

const replyTo = (content: string): string => `Reply to: ${content}`;

const contentsOf = ({ messages }: ConversationDetailResponse): string[] => messages.map(({ content }) => content);

beforeEach(() => {
  vi.mocked(generateReply).mockImplementation((_email, messages) =>
    Promise.resolve(replyTo(messages.at(-1)?.content ?? "")),
  );
});

describe("POST /chat/send", () => {
  it("stores the message and reply in a new conversation listed in the user's history", async () => {
    const agent = await signUp(EMAIL);

    const sent = await agent.post("/api/v1/chat/send").send({ message: "Where is my order?" }).expect(201);
    const detail = sent.body as ConversationDetailResponse;

    expect(contentsOf(detail)).toEqual(["Where is my order?", replyTo("Where is my order?")]);
    expect(generateReply).toHaveBeenCalledWith(EMAIL, [{ role: "user", content: "Where is my order?" }]);

    const history = await agent.get("/api/v1/chat/history").expect(200);
    expect((history.body as ConversationPageResponse).conversations).toEqual([
      expect.objectContaining({ id: detail.conversation.id }),
    ]);
  });

  it("sends earlier messages as context when continuing a conversation", async () => {
    const agent = await signUp(EMAIL);
    const first = await agent.post("/api/v1/chat/send").send({ message: "Hi" }).expect(201);
    const { conversation } = first.body as ConversationDetailResponse;

    await agent.post("/api/v1/chat/send").send({ message: "Track HB-1043", conversationId: conversation.id }).expect(201);

    expect(generateReply).toHaveBeenLastCalledWith(EMAIL, [
      { role: "user", content: "Hi" },
      { role: "assistant", content: replyTo("Hi") },
      { role: "user", content: "Track HB-1043" },
    ]);
  });

  it("stores nothing when the assistant fails", async () => {
    const agent = await signUp(EMAIL);
    vi.mocked(generateReply).mockRejectedValueOnce(createHttpError(502, "The assistant is unavailable"));

    await agent.post("/api/v1/chat/send").send({ message: "Hi" }).expect(502);

    const history = await agent.get("/api/v1/chat/history").expect(200);
    expect((history.body as ConversationPageResponse).conversations).toEqual([]);
  });

  it("rejects an empty message without calling the assistant", async () => {
    const agent = await signUp(EMAIL);

    await agent.post("/api/v1/chat/send").send({ message: "   " }).expect(400);

    expect(generateReply).not.toHaveBeenCalled();
  });
});

describe("conversation ownership", () => {
  it("hides a conversation from every other user", async () => {
    const owner = await signUp(EMAIL);
    const sent = await owner.post("/api/v1/chat/send").send({ message: "My address is private" }).expect(201);
    const { conversation, messages } = sent.body as ConversationDetailResponse;
    const path = `/api/v1/chat/history/${conversation.id}`;

    const other = await signUp("sam@example.com");
    const otherHistory = await other.get("/api/v1/chat/history").expect(200);
    expect((otherHistory.body as ConversationPageResponse).conversations).toEqual([]);
    await other.get(path).expect(404);
    await other.post("/api/v1/chat/send").send({ message: "Hi", conversationId: conversation.id }).expect(404);
    await other.patch(path).send({ title: "Taken" }).expect(404);
    await other.patch(`${path}/messages/${messages[0]?.id ?? ""}`).send({ message: "Edited" }).expect(404);
    await other.delete(path).expect(404);

    const unchanged = await owner.get(path).expect(200);
    expect(contentsOf(unchanged.body as ConversationDetailResponse)).toEqual(contentsOf(sent.body as ConversationDetailResponse));
  });
});

describe("PATCH /chat/history/:conversationId/messages/:messageId", () => {
  it("replaces the edited message and every message after it", async () => {
    const agent = await signUp(EMAIL);
    const first = await agent.post("/api/v1/chat/send").send({ message: "Refund HB-1044" }).expect(201);
    const { conversation, messages } = first.body as ConversationDetailResponse;
    await agent.post("/api/v1/chat/send").send({ message: "Thanks", conversationId: conversation.id }).expect(201);

    const edited = await agent
      .patch(`/api/v1/chat/history/${conversation.id}/messages/${messages[0]?.id ?? ""}`)
      .send({ message: "Refund HB-1047" })
      .expect(200);

    expect(contentsOf(edited.body as ConversationDetailResponse)).toEqual(["Refund HB-1047", replyTo("Refund HB-1047")]);
    expect(generateReply).toHaveBeenLastCalledWith(EMAIL, [{ role: "user", content: "Refund HB-1047" }]);
  });
});

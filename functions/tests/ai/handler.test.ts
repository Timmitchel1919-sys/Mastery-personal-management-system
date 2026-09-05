import type { CallableRequest } from "firebase-functions/https";
import { describe, expect, it } from "vitest";
import { HttpsError } from "../../src/shared/errors";
import { estimateCostUsd, extractJson, handleAiIntent } from "../../src/ai/shared/handler";
import { MAX_REQUESTS_PER_DAY } from "../../src/ai/shared/quota";
import { asFirestore, createFakeFirestore, createFakeProvider } from "./fakes";

function makeRequest(data: unknown, uid: string | null = "u1"): CallableRequest<unknown> {
  return {
    auth: uid ? { uid, token: {} as never } : undefined,
    data,
  } as unknown as CallableRequest<unknown>;
}

const VALID_MODEL_REPLY = JSON.stringify({
  answer: "Focus on your top goal this week.",
  assumptions: ["You have a few hours available"],
  suggestedActions: [{ id: "a1", label: "Block 2h", description: "Schedule deep work" }],
  disclaimers: [],
});

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses JSON wrapped in a markdown code fence", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("throws on invalid JSON", () => {
    expect(() => extractJson("not json")).toThrow(/valid JSON/);
  });
});

describe("estimateCostUsd", () => {
  it("scales with input and output tokens", () => {
    expect(estimateCostUsd(0, 0)).toBe(0);
    expect(estimateCostUsd(1_000_000, 0)).toBeCloseTo(3);
    expect(estimateCostUsd(0, 1_000_000)).toBeCloseTo(15);
  });
});

describe("handleAiIntent", () => {
  it("throws unauthenticated with no auth", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 10,
      outputTokens: 10,
    });

    await expect(
      handleAiIntent("coach-query", makeRequest({ userMessage: "Hi" }, null), { db, provider }),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("requires a userMessage for coach-query", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 1,
      outputTokens: 1,
    });

    await expect(
      handleAiIntent("coach-query", makeRequest({}), { db, provider }),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("requires a targetRef for goal-breakdown", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 1,
      outputTokens: 1,
    });

    await expect(
      handleAiIntent("goal-breakdown", makeRequest({}), { db, provider }),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("blocks once the daily request quota is reached", async () => {
    const fake = createFakeFirestore();
    const now = new Date("2026-09-04T12:00:00.000Z");
    fake.seedDoc(`users/u1/aiUsageDaily/${now.toISOString().slice(0, 10)}`, {
      requestCount: MAX_REQUESTS_PER_DAY,
      totalTokens: 0,
    });
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 1,
      outputTokens: 1,
    });

    await expect(
      handleAiIntent("coach-query", makeRequest({ userMessage: "Hi" }), { db, provider, now }),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
  });

  it("answers a coach query, records usage, and persists the exchange", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/goals/g1", { title: "Ship v1", status: "active" });
    const db = asFirestore(fake);
    const now = new Date("2026-09-04T12:00:00.000Z");
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 120,
      outputTokens: 40,
    });

    const response = await handleAiIntent(
      "coach-query",
      makeRequest({ userMessage: "What should I focus on?" }),
      { db, provider, now },
    );

    expect(response.answer).toBe("Focus on your top goal this week.");
    expect(response.influencedBy).toEqual([{ collection: "goals", id: "g1", label: "Ship v1" }]);
    expect(response.exchangeId).toBeTruthy();

    const exchange = await fake.doc(`users/u1/coachExchanges/${response.exchangeId}`).get();
    expect(exchange.exists).toBe(true);
    expect(exchange.data()?.answer).toBe("Focus on your top goal this week.");

    const dayUsage = await fake.doc("users/u1/aiUsageDaily/2026-09-04").get();
    expect(dayUsage.data()).toMatchObject({ requestCount: 1, totalTokens: 160 });

    const monthUsage = await fake.doc("users/u1/aiUsageMonthly/2026-09").get();
    expect(monthUsage.data()).toMatchObject({ requestCount: 1, totalTokens: 160 });
  });

  it("wraps a malformed model reply as an internal error and still records usage", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);
    const now = new Date("2026-09-04T12:00:00.000Z");
    const provider = createFakeProvider({ text: "not json", inputTokens: 5, outputTokens: 5 });

    await expect(
      handleAiIntent("coach-query", makeRequest({ userMessage: "Hi" }), { db, provider, now }),
    ).rejects.toBeInstanceOf(HttpsError);

    const dayUsage = await fake.doc("users/u1/aiUsageDaily/2026-09-04").get();
    expect(dayUsage.data()).toMatchObject({ requestCount: 1, totalTokens: 10 });
  });

  it("passes an existing HttpsError from the provider straight through", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);
    const provider = createFakeProvider(new HttpsError("unavailable", "provider is down"));

    await expect(
      handleAiIntent("coach-query", makeRequest({ userMessage: "Hi" }), { db, provider }),
    ).rejects.toMatchObject({ code: "unavailable" });
  });
});

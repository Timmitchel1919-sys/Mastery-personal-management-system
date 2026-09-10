import type { CallableRequest } from "firebase-functions/https";
import { describe, expect, it } from "vitest";
import { handleGeneratePersonalInsight } from "../../src/ai/personal-insight/handler";
import { asFirestore, createFakeFirestore, createFakeProvider } from "./fakes";

function makeRequest(data: unknown, uid: string | null = "u1"): CallableRequest<unknown> {
  return {
    auth: uid ? { uid, token: {} as never } : undefined,
    data,
  } as unknown as CallableRequest<unknown>;
}

const BASE_REQUEST = {
  category: "DAILY_BRIEF",
  moduleId: "focus",
  title: "Focus AI review",
  deterministicSummary: "Focus sessions increased in the current period.",
  deterministicRecommendation: "Keep one protected morning block.",
  facts: [
    { id: "f1", label: "Completed sessions", value: "6" },
    { id: "f2", label: "Morning starts", value: "4" },
    { id: "f3", label: "Attention insights", value: "1" },
  ],
  limitations: ["Sample size is still moderate."],
  sourceInsightIds: ["focus-morning-pattern"],
} as const;

describe("handleGeneratePersonalInsight", () => {
  it("returns a validated grounded response and bumps usage counters", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);
    const now = new Date("2026-09-10T12:00:00.000Z");
    const provider = createFakeProvider({
      text: JSON.stringify({
        summary: "You completed 6 sessions, including 4 morning starts.",
        interpretation: "The available data suggests your focus consistency is improving.",
        recommendations: ["Protect your strongest morning block for high-value work."],
        limitations: ["Pattern confidence will improve with more sessions."],
        factRefs: [0, 1],
      }),
      inputTokens: 80,
      outputTokens: 40,
    });

    const response = await handleGeneratePersonalInsight(makeRequest(BASE_REQUEST), {
      db,
      provider,
      now,
    });

    expect(response.facts).toEqual([
      { id: "f1", label: "Completed sessions", value: "6" },
      { id: "f2", label: "Morning starts", value: "4" },
    ]);

    const dayUsage = await fake.doc("users/u1/aiUsageDaily/2026-09-10").get();
    expect(dayUsage.data()).toMatchObject({ requestCount: 1, totalTokens: 120 });
  });

  it("rejects malformed AI output", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({ text: "not json", inputTokens: 5, outputTokens: 3 });

    await expect(
      handleGeneratePersonalInsight(makeRequest(BASE_REQUEST), { db, provider }),
    ).rejects.toMatchObject({ code: "internal" });
  });

  it("rejects unsupported numeric claims", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({
      text: JSON.stringify({
        summary: "You completed 8 sessions recently.",
        interpretation: "Momentum is rising.",
        recommendations: ["Keep going."],
        limitations: [],
        factRefs: [0],
      }),
      inputTokens: 12,
      outputTokens: 10,
    });

    await expect(
      handleGeneratePersonalInsight(makeRequest(BASE_REQUEST), { db, provider }),
    ).rejects.toMatchObject({ code: "internal" });
  });

  it("rejects citing unsupported facts", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({
      text: JSON.stringify({
        summary: "Focus is improving.",
        interpretation: "Signal appears stable.",
        recommendations: ["Keep the current rhythm."],
        limitations: [],
        factRefs: [99],
      }),
      inputTokens: 10,
      outputTokens: 8,
    });

    await expect(
      handleGeneratePersonalInsight(makeRequest(BASE_REQUEST), { db, provider }),
    ).rejects.toMatchObject({ code: "internal" });
  });

  it("requires authentication", async () => {
    const db = asFirestore(createFakeFirestore());
    const provider = createFakeProvider({ text: "{}", inputTokens: 1, outputTokens: 1 });

    await expect(
      handleGeneratePersonalInsight(makeRequest(BASE_REQUEST, null), { db, provider }),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });
});

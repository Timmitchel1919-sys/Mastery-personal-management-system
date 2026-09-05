import type { CallableRequest } from "firebase-functions/https";
import { describe, expect, it } from "vitest";
import { HttpsError } from "../../src/shared/errors";
import { handleRecoveryCoachQuery } from "../../src/recovery/recovery-coach-query";
import { MAX_REQUESTS_PER_DAY } from "../../src/ai/shared/quota";
import { asFirestore, createFakeFirestore, createFakeProvider } from "../ai/fakes";
import type { FakeFirestore } from "../ai/fakes";

function makeRequest(data: unknown, uid: string | null = "u1"): CallableRequest<unknown> {
  return {
    auth: uid ? { uid, token: {} as never } : undefined,
    data,
  } as unknown as CallableRequest<unknown>;
}

const REPLY = JSON.stringify({
  reply: "That urge is real and it will pass. Try a ten-minute delay first.",
  suggestedSteps: [
    { id: "s1", label: "Ten-minute delay", description: "Set a timer and do one other thing." },
  ],
  disclaimers: [],
});

function seedGoal(fake: FakeFirestore, extra: Record<string, unknown> = {}) {
  fake.seedDoc("users/u1/recoveryGoals/g1", {
    behavior: "Late-night doomscrolling",
    motivation: "Sleep better",
    recoveryStatus: "challenging",
    triggers: ["Boredom"],
    faithBasedEncouragement: false,
    ...extra,
  });
}

const now = new Date("2026-09-05T20:00:00.000Z");

describe("handleRecoveryCoachQuery", () => {
  it("throws unauthenticated with no auth", async () => {
    const provider = createFakeProvider({ text: REPLY, inputTokens: 1, outputTokens: 1 });
    await expect(
      handleRecoveryCoachQuery(makeRequest({ goalId: "g1", message: "help" }, null), {
        db: asFirestore(createFakeFirestore()),
        provider,
      }),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects a payload with no message", async () => {
    const provider = createFakeProvider({ text: REPLY, inputTokens: 1, outputTokens: 1 });
    await expect(
      handleRecoveryCoachQuery(makeRequest({ goalId: "g1" }), {
        db: asFirestore(createFakeFirestore()),
        provider,
      }),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a payload with no goalId", async () => {
    const provider = createFakeProvider({ text: REPLY, inputTokens: 1, outputTokens: 1 });
    await expect(
      handleRecoveryCoachQuery(makeRequest({ message: "help" }), {
        db: asFirestore(createFakeFirestore()),
        provider,
      }),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws not-found when the goal doesn't exist or isn't the caller's", async () => {
    const provider = createFakeProvider({ text: REPLY, inputTokens: 1, outputTokens: 1 });
    await expect(
      handleRecoveryCoachQuery(makeRequest({ goalId: "g1", message: "help" }), {
        db: asFirestore(createFakeFirestore()),
        provider,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("blocks once the daily request quota is reached", async () => {
    const fake = createFakeFirestore();
    seedGoal(fake);
    fake.seedDoc(`users/u1/aiUsageDaily/${now.toISOString().slice(0, 10)}`, {
      requestCount: MAX_REQUESTS_PER_DAY,
      totalTokens: 0,
    });
    const provider = createFakeProvider({ text: REPLY, inputTokens: 1, outputTokens: 1 });
    await expect(
      handleRecoveryCoachQuery(makeRequest({ goalId: "g1", message: "help" }), {
        db: asFirestore(fake),
        provider,
        now,
      }),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
  });

  it("answers, persists an isolated session, bumps shared counters, and writes NO aiCallLog", async () => {
    const fake = createFakeFirestore();
    seedGoal(fake);
    const provider = createFakeProvider({ text: REPLY, inputTokens: 100, outputTokens: 30 });

    const response = await handleRecoveryCoachQuery(
      makeRequest({ goalId: "g1", message: "I've had the urge all evening" }),
      { db: asFirestore(fake), provider, now },
    );

    expect(response.reply).toContain("ten-minute delay");
    expect(response.influencedBy).toEqual([
      { collection: "recoveryGoals", id: "g1", label: "Late-night doomscrolling" },
    ]);
    expect(response.sessionId).toBeTruthy();

    const session = await fake.doc(`users/u1/recoveryCoachSessions/${response.sessionId}`).get();
    expect(session.exists).toBe(true);
    expect(session.data()).toMatchObject({
      goalId: "g1",
      message: "I've had the urge all evening",
      createdBy: "u1",
      status: "active",
      inputTokens: 100,
      outputTokens: 30,
    });

    // Shared spend counters move…
    const day = await fake.doc("users/u1/aiUsageDaily/2026-09-05").get();
    expect(day.data()).toMatchObject({ requestCount: 1, totalTokens: 130 });

    // …but nothing recovery-derived is written to the general audit log.
    const logs = await fake.collection("users/u1/aiCallLogs").get();
    expect(logs.empty).toBe(true);
  });

  it("tells the model the user opted OUT of faith-based encouragement by default", async () => {
    const fake = createFakeFirestore();
    seedGoal(fake);
    let capturedPrompt = "";
    const provider = createFakeProvider((input) => {
      capturedPrompt = input.prompt;
      return { text: REPLY, inputTokens: 1, outputTokens: 1 };
    });

    await handleRecoveryCoachQuery(makeRequest({ goalId: "g1", message: "help" }), {
      db: asFirestore(fake),
      provider,
      now,
    });
    expect(capturedPrompt).toContain("has not opted in to faith-based encouragement");
  });

  it("tells the model faith-based encouragement is allowed when the goal opts in", async () => {
    const fake = createFakeFirestore();
    seedGoal(fake, { faithBasedEncouragement: true });
    let capturedPrompt = "";
    const provider = createFakeProvider((input) => {
      capturedPrompt = input.prompt;
      return { text: REPLY, inputTokens: 1, outputTokens: 1 };
    });

    await handleRecoveryCoachQuery(makeRequest({ goalId: "g1", message: "help" }), {
      db: asFirestore(fake),
      provider,
      now,
    });
    expect(capturedPrompt).toContain("has opted in to faith-based encouragement");
  });

  it("wraps a malformed model reply as an HttpsError and still bumps the counter", async () => {
    const fake = createFakeFirestore();
    seedGoal(fake);
    const provider = createFakeProvider({ text: "not json", inputTokens: 5, outputTokens: 5 });

    await expect(
      handleRecoveryCoachQuery(makeRequest({ goalId: "g1", message: "help" }), {
        db: asFirestore(fake),
        provider,
        now,
      }),
    ).rejects.toBeInstanceOf(HttpsError);

    const day = await fake.doc("users/u1/aiUsageDaily/2026-09-05").get();
    expect(day.data()).toMatchObject({ requestCount: 1, totalTokens: 10 });
  });
});

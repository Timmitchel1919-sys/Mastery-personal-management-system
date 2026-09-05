import { describe, expect, it } from "vitest";
import { generateWeeklySummaryForUser } from "../../src/scheduled/weekly-summary/generate-weekly-summary-for-user";
import { asFirestore, createFakeFirestore, createFakeProvider } from "../ai/fakes";

const NOW = new Date("2026-09-07T01:00:00.000Z"); // a Monday

const VALID_MODEL_REPLY = JSON.stringify({
  lessons: ["You kept a strong focus streak this week."],
  suggestedPriorities: ["Follow up on the overdue task."],
});

describe("generateWeeklySummaryForUser", () => {
  it("collects facts, calls the provider, and persists the summary + a notification", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/goals/g1", {
      title: "Ship v1",
      goalStatus: "achieved",
      updatedAt: "2026-09-02T10:00:00.000Z",
    });
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 50,
      outputTokens: 20,
    });

    const result = await generateWeeklySummaryForUser("u1", "UTC", { db, provider, now: NOW });
    expect(result).not.toBeNull();

    const summary = await fake.doc(`users/u1/weeklySummaries/${result!.summaryId}`).get();
    expect(summary.exists).toBe(true);
    expect(summary.data()).toMatchObject({
      weekStart: "2026-08-31",
      weekEnd: "2026-09-07",
      goalsCompleted: ["Ship v1"],
      lessons: ["You kept a strong focus streak this week."],
      suggestedPriorities: ["Follow up on the overdue task."],
    });
  });

  it("writes a notification alongside the summary", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 10,
      outputTokens: 10,
    });

    await generateWeeklySummaryForUser("u1", "UTC", { db, provider, now: NOW });

    const notifications = await fake.collection("users/u1/notifications").get();
    expect(notifications.docs).toHaveLength(1);
    expect(notifications.docs[0]!.data()).toMatchObject({ type: "weekly-summary", read: false });
  });

  it("is idempotent: does nothing for a week that already has a summary", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/weeklySummaries/existing", { weekStart: "2026-08-31" });
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await generateWeeklySummaryForUser("u1", "UTC", { db, provider, now: NOW });
    expect(result).toBeNull();

    const summaries = await fake.collection("users/u1/weeklySummaries").get();
    expect(summaries.docs).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { runWeeklySummaries } from "../../src/scheduled/weekly-summary/run-weekly-summaries";
import { asFirestore, createFakeFirestore, createFakeProvider } from "../ai/fakes";

const MONDAY = new Date("2026-09-07T01:00:00.000Z");
const TUESDAY = new Date("2026-09-08T01:00:00.000Z");

const VALID_MODEL_REPLY = JSON.stringify({
  lessons: ["Lesson"],
  suggestedPriorities: ["Priority"],
});

describe("runWeeklySummaries", () => {
  it("generates only for active, opted-in users whose local day is Monday", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1", { status: "active", timezone: "UTC" }); // Monday for u1
    fake.seedDoc("users/u2", { status: "active", timezone: "UTC", weeklySummaryEnabled: false }); // opted out
    fake.seedDoc("users/u3", { status: "disabled", timezone: "UTC" }); // not active
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await runWeeklySummaries({ db, provider, now: MONDAY });

    expect(result.processed).toBe(1);
    expect(result.generated).toBe(1);
    expect(result.errors).toEqual([]);

    const u1Summaries = await fake.collection("users/u1/weeklySummaries").get();
    expect(u1Summaries.docs).toHaveLength(1);
    const u2Summaries = await fake.collection("users/u2/weeklySummaries").get();
    expect(u2Summaries.docs).toHaveLength(0);
  });

  it("skips everyone when it isn't their local Monday", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1", { status: "active", timezone: "UTC" });
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await runWeeklySummaries({ db, provider, now: TUESDAY });
    expect(result).toEqual({ processed: 0, generated: 0, errors: [] });
  });

  it("defaults a missing weeklySummaryEnabled field to opted-in", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1", { status: "active", timezone: "UTC" }); // no weeklySummaryEnabled field at all
    const db = asFirestore(fake);
    const provider = createFakeProvider({
      text: VALID_MODEL_REPLY,
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await runWeeklySummaries({ db, provider, now: MONDAY });
    expect(result.generated).toBe(1);
  });

  it("records one user's failure without aborting the batch", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1", { status: "active", timezone: "UTC" });
    fake.seedDoc("users/u2", { status: "active", timezone: "UTC" });
    const db = asFirestore(fake);

    let calls = 0;
    const provider = createFakeProvider(() => {
      calls += 1;
      if (calls === 1) throw new Error("provider exploded");
      return { text: VALID_MODEL_REPLY, inputTokens: 10, outputTokens: 10 };
    });

    const result = await runWeeklySummaries({ db, provider, now: MONDAY });
    expect(result.processed).toBe(2);
    expect(result.generated).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toMatch(/provider exploded/);
  });
});

import { describe, expect, it } from "vitest";
import {
  MAX_REQUESTS_PER_DAY,
  MAX_TOKENS_PER_DAY,
  MAX_TOKENS_PER_MONTH,
  bumpUsageCounters,
  checkQuota,
} from "../../src/ai/shared/quota";
import { asFirestore, createFakeFirestore } from "./fakes";

describe("checkQuota", () => {
  it("allows a request with no prior usage", () => {
    expect(checkQuota(undefined, undefined)).toEqual({ ok: true });
  });

  it("allows a request just under every limit", () => {
    const day = { requestCount: MAX_REQUESTS_PER_DAY - 1, totalTokens: MAX_TOKENS_PER_DAY - 1 };
    const month = { requestCount: 1, totalTokens: MAX_TOKENS_PER_MONTH - 1 };
    expect(checkQuota(day, month)).toEqual({ ok: true });
  });

  it("blocks once the daily request count is reached", () => {
    const result = checkQuota({ requestCount: MAX_REQUESTS_PER_DAY, totalTokens: 0 }, undefined);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/today's AI request limit/i);
  });

  it("blocks once the daily token count is reached", () => {
    const result = checkQuota({ requestCount: 0, totalTokens: MAX_TOKENS_PER_DAY }, undefined);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/today's AI token limit/i);
  });

  it("blocks once the monthly token count is reached", () => {
    const result = checkQuota(undefined, { requestCount: 0, totalTokens: MAX_TOKENS_PER_MONTH });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/month's AI usage limit/i);
  });
});

describe("bumpUsageCounters", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  it("creates day and month rollups on the first call", async () => {
    const fake = createFakeFirestore();
    await bumpUsageCounters(asFirestore(fake), "u1", 150, now);

    expect((await fake.doc("users/u1/aiUsageDaily/2026-09-05").get()).data()).toMatchObject({
      requestCount: 1,
      totalTokens: 150,
    });
    expect((await fake.doc("users/u1/aiUsageMonthly/2026-09").get()).data()).toMatchObject({
      requestCount: 1,
      totalTokens: 150,
    });
  });

  it("adds to existing counters", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/aiUsageDaily/2026-09-05", { requestCount: 2, totalTokens: 200 });
    fake.seedDoc("users/u1/aiUsageMonthly/2026-09", { requestCount: 9, totalTokens: 5000 });

    await bumpUsageCounters(asFirestore(fake), "u1", 100, now);

    expect((await fake.doc("users/u1/aiUsageDaily/2026-09-05").get()).data()).toMatchObject({
      requestCount: 3,
      totalTokens: 300,
    });
    expect((await fake.doc("users/u1/aiUsageMonthly/2026-09").get()).data()).toMatchObject({
      requestCount: 10,
      totalTokens: 5100,
    });
  });

  it("does not write an aiCallLogs document", async () => {
    const fake = createFakeFirestore();
    await bumpUsageCounters(asFirestore(fake), "u1", 10, now);
    expect((await fake.collection("users/u1/aiCallLogs").get()).empty).toBe(true);
  });
});

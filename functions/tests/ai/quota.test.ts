import { describe, expect, it } from "vitest";
import {
  MAX_REQUESTS_PER_DAY,
  MAX_TOKENS_PER_DAY,
  MAX_TOKENS_PER_MONTH,
  checkQuota,
} from "../../src/ai/shared/quota";

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

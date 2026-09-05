import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUDGETS, checkBudgets, collectAssets, summarize } from "../../scripts/analyze-bundle.mjs";

describe("scripts/analyze-bundle.mjs", () => {
  it("exposes the three documented budgets", () => {
    expect(BUDGETS).toMatchObject({
      totalJsGzipKiB: expect.any(Number),
      totalJsRawKiB: expect.any(Number),
      largestChunkGzipKiB: expect.any(Number),
    });
  });

  it("checkBudgets flags a chunk over the largest-chunk budget", () => {
    const over = {
      totalJsGzip: 10 * 1024,
      totalJsRaw: 30 * 1024,
      largestChunkGzip: (BUDGETS.largestChunkGzipKiB + 50) * 1024,
    };
    expect(checkBudgets(over).join(" ")).toMatch(/largest chunk/);
  });

  it("checkBudgets passes a summary inside every budget", () => {
    expect(checkBudgets({ totalJsGzip: 1024, totalJsRaw: 1024, largestChunkGzip: 1024 })).toEqual(
      [],
    );
  });

  // When a build is present (CI runs `analyze` after `build`; locally after `npm run build`)
  // assert the real bundle is within budget. Skipped on a bare checkout.
  const built = existsSync("out/_next/static");
  it.skipIf(!built)("the current build is within every budget", () => {
    const breaches = checkBudgets(summarize(collectAssets()));
    expect(breaches).toEqual([]);
  });
});

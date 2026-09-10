import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MasteryInsight } from "./mastery-intelligence";

const generateAiPersonalInsight = vi.fn();

vi.mock("./ai-personal-insight-client", () => ({
  generateAiPersonalInsight: (...args: unknown[]) => generateAiPersonalInsight(...args),
}));

import { useAiPersonalInsight } from "./use-ai-personal-insight";

const insight: MasteryInsight = {
  id: "focus-pattern",
  type: "PATTERN",
  title: "Focus sessions are strongest earlier in the day",
  summary: "4/6 sessions started before 11:00.",
  detail: "This is a historical pattern, not a fixed rule.",
  recommendation: "Protect one morning block.",
  severity: "low",
  confidence: "medium",
  signal: "moderate",
  source: ["focusSessions"],
  relatedModule: "focus",
  createdAt: "2026-09-10T00:00:00.000Z",
  actions: [{ label: "Open Deep Work", href: "/focus/deep-work" }],
  status: "active",
  evidence: ["6 completed sessions reviewed"],
};

beforeEach(() => {
  generateAiPersonalInsight.mockReset();
  sessionStorage.clear();
});

describe("useAiPersonalInsight", () => {
  it("does not call AI when insufficient deterministic data exists", async () => {
    const { result } = renderHook(() =>
      useAiPersonalInsight({
        moduleId: "focus",
        insights: [],
        attentionCount: 0,
        recommendationCount: 0,
      }),
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(generateAiPersonalInsight).not.toHaveBeenCalled();
    expect(result.current.canGenerate).toBe(false);
  });

  it("returns AI response when generation succeeds", async () => {
    generateAiPersonalInsight.mockResolvedValue({
      summary: "You completed 6 sessions.",
      facts: [{ id: "f1", label: "Completed sessions", value: "6" }],
      interpretation: "Consistency is improving.",
      recommendations: ["Keep protecting your morning block."],
      limitations: [],
    });

    const { result } = renderHook(() =>
      useAiPersonalInsight({
        moduleId: "focus",
        insights: [insight],
        attentionCount: 0,
        recommendationCount: 1,
      }),
    );

    await act(async () => {
      await result.current.generate();
    });

    expect(generateAiPersonalInsight).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("ready");
    expect(result.current.response?.summary).toContain("6");
  });
});

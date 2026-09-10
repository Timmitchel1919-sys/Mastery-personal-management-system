import { describe, expect, it } from "vitest";
import { buildAiPersonalInsightContext, hasSufficientDataForAi } from "./ai-personal-insight-context";
import type { MasteryInsight } from "./mastery-intelligence";

const insight: MasteryInsight = {
  id: "act-overdue",
  type: "ATTENTION",
  title: "Execution backlog needs review",
  summary: "2 overdue and 1 blocked tasks are active.",
  detail: "5 open tasks total in Act.",
  recommendation: "Review overdue work before adding commitments.",
  severity: "high",
  confidence: "high",
  signal: "strong",
  source: ["tasks"],
  relatedModule: "act",
  createdAt: "2026-09-10T00:00:00.000Z",
  actions: [{ label: "Open Tasks", href: "/act/tasks" }],
  status: "active",
  evidence: ["5 open tasks", "2 overdue"],
};

describe("buildAiPersonalInsightContext", () => {
  it("returns null when there is no deterministic data", () => {
    expect(
      buildAiPersonalInsightContext({
        moduleId: "act",
        insights: [],
        attentionCount: 0,
        recommendationCount: 0,
      }),
    ).toBeNull();
  });

  it("builds minimized, deterministic context", () => {
    const context = buildAiPersonalInsightContext({
      moduleId: "act",
      insights: [insight],
      attentionCount: 1,
      recommendationCount: 0,
    });

    expect(context).not.toBeNull();
    expect(context?.facts.length).toBeGreaterThan(0);
    expect(JSON.stringify(context)).not.toMatch(/api[_-]?key|token|password/i);
    expect(context?.sourceInsightIds).toEqual(["act-overdue"]);
  });
});

describe("hasSufficientDataForAi", () => {
  it("tracks minimum requirement from deterministic insights", () => {
    expect(
      hasSufficientDataForAi({
        moduleId: "focus",
        insights: [],
        attentionCount: 0,
        recommendationCount: 0,
      }),
    ).toBe(false);

    expect(
      hasSufficientDataForAi({
        moduleId: "focus",
        insights: [insight],
        attentionCount: 1,
        recommendationCount: 0,
      }),
    ).toBe(true);
  });
});

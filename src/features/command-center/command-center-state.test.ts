import { describe, expect, it } from "vitest";
import type { BrainModuleId } from "@/features/brain-hub/brain-modules";
import type { BrainModuleVisual, BrainSystemState } from "@/features/brain-hub/brain-state";
import type { DecisionRecord } from "@/features/decisions/schema";
import type { MasteryInsight } from "@/features/intelligence/mastery-intelligence";
import type { PredictiveSignal } from "@/features/predictions/prediction-model";
import {
  buildCommandCenter,
  isEmptyCommandCenter,
  type CommandCenterInput,
} from "./command-center-state";

const NOW = "2026-09-10T09:00:00.000Z";

function insight(over: Partial<MasteryInsight> & { id: string }): MasteryInsight {
  return {
    id: over.id,
    type: over.type ?? "trend",
    title: over.title ?? over.id,
    summary: over.summary ?? "summary",
    detail: over.detail ?? "detail",
    recommendation: over.recommendation ?? "consider reviewing",
    severity: over.severity ?? "medium",
    confidence: over.confidence ?? "medium",
    signal: over.signal ?? "moderate",
    status: over.status ?? "active",
    relatedModule: over.relatedModule ?? "global",
    createdAt: over.createdAt ?? NOW,
    actions: over.actions ?? [],
    evidence: over.evidence ?? [],
  } as MasteryInsight;
}

function signal(over: Partial<PredictiveSignal> & { id: string }): PredictiveSignal {
  return {
    id: over.id,
    category: over.category ?? "deadline-risk",
    urgency: over.urgency ?? "important",
    prediction: over.prediction ?? "A deadline may slip",
    evidence: over.evidence ?? ["3 tasks due this week"],
    confidence: over.confidence ?? "moderate",
    recommendation: over.recommendation ?? "Re-sequence the week",
    action: over.action ?? { label: "Open Tasks", href: "/act/tasks" },
    generatedAt: over.generatedAt ?? NOW,
    ...(over.timeWindow ? { timeWindow: over.timeWindow } : {}),
  };
}

function visual(over: Partial<BrainModuleVisual> = {}): BrainModuleVisual {
  return {
    status: over.status ?? "normal",
    progress: over.progress ?? null,
    attentionCount: over.attentionCount ?? 0,
    recentEvent: over.recentEvent ?? false,
    lastUpdatedAt: over.lastUpdatedAt ?? null,
  };
}

function brain(
  overrides: Partial<Record<BrainModuleId, Partial<BrainModuleVisual>>> = {},
  availability: BrainSystemState["availability"] = "ready",
): BrainSystemState {
  const ids: BrainModuleId[] = ["goals", "plan", "focus", "act", "grow", "analytics"];
  const modules = ids.reduce(
    (acc, id) => {
      acc[id] = visual(overrides[id]);
      return acc;
    },
    {} as Record<BrainModuleId, BrainModuleVisual>,
  );
  return { availability, source: "live", overallActivity: "active", modules };
}

function decision(over: Partial<DecisionRecord> & { id: string }): DecisionRecord {
  return {
    id: over.id,
    title: over.title ?? over.id,
    description: "",
    status: over.status ?? "ANALYZING",
    createdAt: NOW,
    updatedAt: NOW,
    decisionDate: "2026-09-10",
    dueDate: over.dueDate,
    domain: over.domain ?? "plan",
    importance: over.importance ?? "medium",
    urgency: over.urgency ?? "medium",
    context: over.context ?? "context",
    desiredOutcome: "outcome",
    userPriority: "balance",
    constraints: [],
    assumptions: [],
    relatedGoals: over.relatedGoals ?? [],
    relatedPlans: over.relatedPlans ?? [],
    relatedPredictions: over.relatedPredictions ?? [],
    relatedRecommendations: [],
    selectedOptionId: null,
    criteria: [],
    options: [],
    tradeOffs: [],
    risks: [],
    scenarios: [],
    evidence: [],
  } as DecisionRecord;
}

function emptyInput(): CommandCenterInput {
  return { nowIso: NOW, intelligence: null, predictions: null, brain: null, decisions: null };
}

describe("buildCommandCenter", () => {
  it("returns a no-data mode and empty panels when nothing is available", () => {
    const state = buildCommandCenter(emptyInput());
    expect(state.mode).toBe("no-data");
    expect(isEmptyCommandCenter(state)).toBe(true);
    expect(state.now.nextAction).toBeNull();
    expect(state.brief.grounded).toBe(true);
    expect(state.brief.source).toBe("deterministic");
    expect(state.degraded.length).toBeGreaterThan(0);
  });

  it("builds a severity-ordered attention queue and dedupes insight + prediction overlap", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      intelligence: {
        status: "ready",
        hasAnyData: true,
        insights: [
          insight({ id: "a", title: "Overdue tasks", severity: "critical", relatedModule: "act" }),
          insight({ id: "b", title: "Low signal", severity: "info", relatedModule: "grow" }),
        ],
        today: [],
        progress: [],
        attention: [
          insight({ id: "a", title: "Overdue tasks", severity: "critical", relatedModule: "act" }),
          insight({ id: "c", title: "Plan drift", severity: "high", relatedModule: "plan" }),
        ],
        patterns: [],
        recommendations: [],
      },
    });

    expect(state.attention.map((item) => item.severity)).toEqual(["CRITICAL", "WARNING"]);
    expect(state.attention.filter((item) => item.title === "Overdue tasks")).toHaveLength(1);
    expect(state.mode).toBe("high-risk");
  });

  it("only queues decisions that still need judgment and flags overdue ones first", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      decisions: [
        decision({ id: "d1", title: "Decided already", status: "DECIDED", dueDate: "2026-09-01" }),
        decision({ id: "d2", title: "Open on time", status: "READY", dueDate: "2026-12-01" }),
        decision({
          id: "d3",
          title: "Open overdue",
          status: "ANALYZING",
          dueDate: "2026-09-01",
          relatedGoals: ["g1", "g2"],
          relatedPlans: ["p1"],
        }),
      ],
    });

    expect(state.decisions.map((d) => d.id)).toEqual(["d3", "d2"]);
    expect(state.decisions[0]?.overdue).toBe(true);
    expect(state.decisions[0]?.affectedGoals).toBe(2);
    expect(state.decisions[0]?.affectedPlans).toBe(1);
    expect(state.attention.some((item) => item.type === "decision-overdue")).toBe(true);
    expect(state.risk.some((item) => item.category === "DECISION RISK")).toBe(true);
  });

  it("aggregates predictions into risk categories without inventing an engine", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      predictions: {
        status: "ready",
        enabled: true,
        signals: [
          signal({ id: "s1", category: "schedule-overload", prediction: "Week is overloaded" }),
          signal({ id: "s2", category: "goal-trajectory", prediction: "Goal may miss target" }),
        ],
      },
    });

    const categories = state.risk.map((item) => item.category);
    expect(categories).toContain("WORKLOAD RISK");
    expect(categories).toContain("GOAL RISK");
    expect(state.risk[0]?.evidence.length).toBeGreaterThan(0);
  });

  it("ignores predictions entirely when the user disabled them", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      predictions: {
        status: "ready",
        enabled: false,
        signals: [signal({ id: "s1", urgency: "critical" })],
      },
    });
    expect(state.risk).toHaveLength(0);
    expect(state.attention).toHaveLength(0);
    expect(state.degraded.some((line) => line.includes("turned off"))).toBe(true);
  });

  it("reuses brain module progress metrics and never fabricates a composite score", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      brain: brain({
        goals: { progress: 40 },
        act: { progress: null, attentionCount: 2, status: "attention" },
      }),
    });

    const goalsMetric = state.progress.find((metric) => metric.label === "Goals");
    expect(goalsMetric?.value).toBe(40);
    expect(state.progress.find((metric) => metric.label === "Act")).toBeUndefined();
    expect(state.progress.every((metric) => metric.kind === "percent")).toBe(true);
  });

  it("builds strategic alignment chains only from relationships that exist", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      intelligence: {
        status: "ready",
        hasAnyData: true,
        insights: [],
        today: [],
        progress: [],
        attention: [],
        patterns: [],
        recommendations: [
          insight({
            id: "r1",
            title: "Break the roadmap into milestones",
            relatedModule: "goals",
            actions: [{ label: "Open Goals", href: "/plan/goals" }],
          }),
          insight({ id: "r2", title: "Global note", relatedModule: "global" }),
        ],
      },
    });

    expect(state.alignment).toHaveLength(1);
    expect(state.alignment[0]?.steps[0]?.value).toBe("Goals");
    expect(state.alignment[0]?.steps.at(-1)?.href).toBe("/plan/goals");
  });

  it("keeps the executive brief grounded with deterministic fallbacks when AI is absent", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      intelligence: {
        status: "error",
        hasAnyData: false,
        insights: [],
        today: [],
        progress: [],
        attention: [],
        patterns: [],
        recommendations: [],
      },
    });

    expect(state.brief.risk).toBe("No elevated risks detected.");
    expect(state.brief.decision).toBe("No decisions are waiting on you.");
    expect(state.brief.recommendation).toBeNull();
    expect(state.brief.keyDevelopment).toBeNull();
    expect(state.brief.source).toBe("deterministic");
    expect(state.degraded.some((line) => line.includes("Intelligence unavailable"))).toBe(true);
  });

  it("degrades gracefully when every derived source has failed", () => {
    const state = buildCommandCenter({
      nowIso: NOW,
      intelligence: {
        status: "error",
        hasAnyData: false,
        insights: [],
        today: [],
        progress: [],
        attention: [],
        patterns: [],
        recommendations: [],
      },
      predictions: { status: "error", enabled: true, signals: [] },
      brain: { availability: "unavailable", source: "neutral", overallActivity: "idle", modules: brain().modules },
      decisions: [],
    });

    expect(state.mode).toBe("degraded");
    expect(state.degraded.length).toBeGreaterThanOrEqual(3);
    expect(state.brief.state.length).toBeGreaterThan(0);
    expect(state.brief.risk).toBe("No elevated risks detected.");
  });

  it("promotes the top attention item into the Now context and picks a next action", () => {
    const state = buildCommandCenter({
      ...emptyInput(),
      intelligence: {
        status: "ready",
        hasAnyData: true,
        insights: [],
        today: [insight({ id: "t1", title: "Ship the spec", relatedModule: "focus" })],
        progress: [],
        attention: [
          insight({
            id: "att1",
            title: "Two tasks overdue",
            severity: "critical",
            relatedModule: "act",
            actions: [{ label: "Open Tasks", href: "/act/tasks" }],
          }),
        ],
        patterns: [],
        recommendations: [
          insight({
            id: "rec1",
            recommendation: "Re-sequence today",
            relatedModule: "act",
            actions: [{ label: "Open Tasks", href: "/act/tasks" }],
          }),
        ],
      },
      brain: brain({ focus: { status: "active" } }),
    });

    expect(state.now.priority).toBe("Two tasks overdue");
    expect(state.now.alert).toBe("Two tasks overdue");
    expect(state.now.focus).toBe("Focus work in progress");
    expect(state.now.nextAction).toEqual({ label: "Open Tasks", href: "/act/tasks" });
    expect(state.today.length).toBeGreaterThan(0);
  });
});

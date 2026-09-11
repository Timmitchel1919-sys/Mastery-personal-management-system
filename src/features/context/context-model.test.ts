import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { JournalEntry } from "@/features/journal/schema";
import type { Plan } from "@/features/plans/schema";
import type { Task } from "@/features/tasks/schema";
import {
  assembleAiContext,
  buildContextIndex,
  classifyWindow,
  detectContextConflicts,
  deriveRelationships,
  explainRelevance,
  queryContext,
  type ContextSources,
  type ExplicitContextNote,
} from "./context-model";

const NOW = "2026-09-10T09:00:00.000Z";
const iso = (daysAgo: number) => new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString();
const ymd = (daysAgo: number) => iso(daysAgo).slice(0, 10);

function goal(over: Partial<Goal> & { id: string }): Goal {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(90),
    updatedAt: over.updatedAt ?? iso(5),
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? over.id,
    description: over.description ?? "",
    pillarIds: over.pillarIds ?? ["personal"],
    parentPlanId: over.parentPlanId ?? null,
    startDate: null,
    targetDate: over.targetDate ?? null,
    goalStatus: over.goalStatus ?? "in-progress",
    priority: over.priority ?? "medium",
    progress: over.progress ?? 20,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "weekly",
  } as Goal;
}

function plan(over: Partial<Plan> & { id: string }): Plan {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(90),
    updatedAt: over.updatedAt ?? iso(6),
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    horizon: over.horizon ?? "month",
    pillarIds: ["personal"],
    parentId: null,
    startDate: null,
    endDate: null,
    planStatus: over.planStatus ?? "active",
    progress: 30,
    objective: over.objective ?? "objective",
    desiredOutcomes: [],
    keyMeasures: [],
    reviewNotes: "",
  } as Plan;
}

function task(over: Partial<Task> & { id: string }): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(30),
    updatedAt: over.updatedAt ?? iso(2),
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? over.id,
    description: over.description ?? "",
    taskStatus: over.taskStatus ?? "todo",
    priority: over.priority ?? "medium",
    startDate: null,
    dueDate: over.dueDate ?? null,
    pillarIds: ["personal"],
    goalId: over.goalId ?? null,
    projectId: over.projectId ?? null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: 0,
    actualMinutes: 0,
    energyRequirement: "medium",
    tags: over.tags ?? [],
  } as Task;
}

function journal(over: Partial<JournalEntry> & { id: string }): JournalEntry {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: iso(20),
    updatedAt: iso(20),
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: over.title ?? "",
    entryType: over.entryType ?? "free-form",
    entryDate: over.entryDate ?? ymd(20),
    content: over.content ?? "some reflection content",
    gratitudeItems: [],
    moodRating: 3,
    energyLevel: 3,
    pillarIds: [],
    goalId: over.goalId ?? null,
    tags: over.tags ?? [],
    isPrivate: false,
  } as JournalEntry;
}

function decision(over: Partial<DecisionRecord> & { id: string }): DecisionRecord {
  return {
    id: over.id,
    title: over.title ?? over.id,
    description: "",
    status: over.status ?? "ANALYZING",
    createdAt: NOW,
    updatedAt: over.updatedAt ?? iso(4),
    decisionDate: ymd(4),
    domain: over.domain ?? "plan",
    importance: "medium",
    urgency: "medium",
    context: over.context ?? "decision context",
    desiredOutcome: "",
    userPriority: "",
    constraints: [],
    assumptions: [],
    relatedGoals: over.relatedGoals ?? [],
    relatedPlans: over.relatedPlans ?? [],
    relatedPredictions: [],
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

function note(over: Partial<ExplicitContextNote> & { id: string }): ExplicitContextNote {
  return {
    id: over.id,
    title: over.title ?? "Note",
    body: over.body ?? "body",
    tags: over.tags ?? [],
    links: over.links ?? [],
    ...(over.constraintDate ? { constraintDate: over.constraintDate } : {}),
    status: over.status ?? "active",
    createdAt: iso(3),
    updatedAt: over.updatedAt ?? iso(3),
  };
}

function sources(over: Partial<ContextSources> = {}): ContextSources {
  return {
    goals: over.goals ?? [],
    plans: over.plans ?? [],
    tasks: over.tasks ?? [],
    decisions: over.decisions ?? [],
    journal: over.journal ?? [],
    explicitNotes: over.explicitNotes ?? [],
    ...(over.irrelevantSourceIds ? { irrelevantSourceIds: over.irrelevantSourceIds } : {}),
  };
}

describe("buildContextIndex", () => {
  it("indexes each domain entity by reference, not by copying it", () => {
    const index = buildContextIndex(
      sources({
        goals: [goal({ id: "g1", title: "Ship v2", description: "a".repeat(500) })],
        tasks: [task({ id: "t1" })],
        decisions: [decision({ id: "d1" })],
        journal: [journal({ id: "j1", entryType: "lessons-learned" })],
        explicitNotes: [note({ id: "n1" })],
      }),
    );
    expect(index.map((item) => item.type).sort()).toEqual(["DECISION", "GOAL", "LEARNING", "NOTE", "TASK"]);
    const goalItem = index.find((item) => item.type === "GOAL");
    expect(goalItem?.sourceId).toBe("g1");
    expect(goalItem?.snippet.length).toBeLessThanOrEqual(221);
  });

  it("marks completed records as archived and explicit notes as explicit confidence", () => {
    const index = buildContextIndex(
      sources({
        goals: [goal({ id: "g1", goalStatus: "achieved" })],
        explicitNotes: [note({ id: "n1" })],
      }),
    );
    expect(index.find((item) => item.type === "GOAL")?.lifecycle).toBe("archived");
    expect(index.find((item) => item.type === "NOTE")?.confidence).toBe("explicit");
  });

  it("excludes sources the user marked irrelevant and archived notes", () => {
    const index = buildContextIndex(
      sources({
        goals: [goal({ id: "g1" })],
        explicitNotes: [note({ id: "n1", status: "archived" })],
        irrelevantSourceIds: ["g1"],
      }),
    );
    expect(index).toHaveLength(0);
  });
});

describe("deriveRelationships", () => {
  it("connects task→goal, goal→plan and decision→goal by reference", () => {
    const index = buildContextIndex(
      sources({
        goals: [goal({ id: "g1", parentPlanId: "p1" })],
        plans: [plan({ id: "p1" })],
        tasks: [task({ id: "t1", goalId: "g1" })],
        decisions: [decision({ id: "d1", relatedGoals: ["g1"] })],
      }),
    );
    const rels = deriveRelationships(index);
    expect(rels).toContainEqual({ fromId: "ctx:task:t1", toId: "ctx:goal:g1", kind: "belongs-to" });
    expect(rels).toContainEqual({ fromId: "ctx:goal:g1", toId: "ctx:plan:p1", kind: "belongs-to" });
    expect(rels).toContainEqual({ fromId: "ctx:decision:d1", toId: "ctx:goal:g1", kind: "affects" });
  });
});

describe("queryContext", () => {
  const index = buildContextIndex(
    sources({
      goals: [goal({ id: "g1", title: "Certification", pillarIds: ["personal"] })],
      plans: [plan({ id: "p1", title: "Q3 plan" })],
      tasks: [
        task({ id: "t1", title: "Study module 1", goalId: "g1", updatedAt: iso(1) }),
        task({ id: "t2", title: "Unrelated errand", updatedAt: iso(1) }),
      ],
      journal: [journal({ id: "j1", title: "Old note", entryType: "free-form", entryDate: ymd(200) })],
      explicitNotes: [note({ id: "n1", title: "Keep evenings free", tags: ["personal"] })],
    }),
  );
  const rels = deriveRelationships(index);

  it("ranks the active record and its direct links as DIRECT", () => {
    const results = queryContext(index, rels, { now: NOW, activeGoalId: "g1", module: "goals" });
    const direct = results.filter((r) => r.relevance === "direct").map((r) => r.item.sourceId);
    expect(direct).toContain("g1");
    expect(direct).toContain("t1"); // task linked to the goal
    expect(results.find((r) => r.item.sourceId === "t2")).toBeUndefined(); // unrelated errand not surfaced
  });

  it("gives explicit user context high relevance", () => {
    const results = queryContext(index, rels, { now: NOW, module: "goals", tags: ["personal"] });
    const explicit = results.find((r) => r.item.type === "NOTE");
    expect(explicit?.relevance).toBe("high");
    expect(explicit?.reason).toMatch(/you added this/i);
  });

  it("applies temporal windows and can filter to recent only", () => {
    const recent = queryContext(index, rels, { now: NOW, module: "grow", windows: ["recent", "current", "today"] });
    expect(recent.find((r) => r.item.sourceId === "j1")).toBeUndefined(); // 200 days old = historical
    const all = queryContext(index, rels, { now: NOW, module: "grow" });
    expect(all.find((r) => r.item.sourceId === "j1")?.window).toBe("historical");
  });

  it("supports deterministic text search across title, snippet and tags", () => {
    const results = queryContext(index, rels, { now: NOW, text: "certification" });
    expect(results.map((r) => r.item.sourceId)).toContain("g1");
  });

  it("never surfaces items with no relationship, module or tag match", () => {
    const results = queryContext(index, rels, { now: NOW, module: "analytics" });
    expect(results.every((r) => r.relevance !== "irrelevant")).toBe(true);
  });
});

describe("classifyWindow", () => {
  it("separates current / today / recent / historical by age", () => {
    const [current, recent, old] = buildContextIndex(
      sources({
        tasks: [
          task({ id: "t-now", updatedAt: iso(0) }),
          task({ id: "t-recent", updatedAt: iso(10) }),
          task({ id: "t-old", updatedAt: iso(90) }),
        ],
      }),
    );
    expect(classifyWindow(current!, NOW)).toBe("current");
    expect(classifyWindow(recent!, NOW)).toBe("recent");
    expect(classifyWindow(old!, NOW)).toBe("historical");
  });
});

describe("detectContextConflicts", () => {
  it("flags an explicit constraint date that disagrees with the goal's target", () => {
    const src = sources({
      goals: [goal({ id: "g1", title: "Launch", targetDate: ymd(-30) })],
      explicitNotes: [
        note({ id: "n1", title: "Deadline", constraintDate: ymd(-60), links: [{ type: "GOAL", sourceId: "g1" }] }),
      ],
    });
    const conflicts = detectContextConflicts(src, buildContextIndex(src));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.field).toBe("date");
    expect(conflicts[0]?.statement).toMatch(/but goal/i);
  });

  it("does not resolve conflicts automatically — it only reports them", () => {
    const src = sources({
      goals: [goal({ id: "g1", targetDate: "2026-07-01" })],
      explicitNotes: [
        note({ id: "n1", constraintDate: "2026-06-01", links: [{ type: "GOAL", sourceId: "g1" }] }),
      ],
    });
    const conflicts = detectContextConflicts(src, buildContextIndex(src));
    expect(conflicts[0]?.values).toEqual(["2026-06-01", "2026-07-01"]);
  });
});

describe("assembleAiContext (minimum necessary + hallucination protection)", () => {
  const index = buildContextIndex(
    sources({
      goals: [goal({ id: "g1", title: "Certification" })],
      tasks: Array.from({ length: 20 }, (_, i) =>
        task({ id: `t${i}`, title: `Study ${i}`, goalId: "g1", description: "x".repeat(300), updatedAt: iso(1) }),
      ),
    }),
  );
  const rels = deriveRelationships(index);

  it("returns 'No relevant history found' when nothing is relevant", () => {
    const bundle = assembleAiContext(buildContextIndex(sources()), [], { intent: "review", module: "goals" });
    expect(bundle.items).toHaveLength(0);
    expect(bundle.note).toBe("No relevant history found.");
  });

  it("caps the bundle to the minimum necessary and reports what was omitted", () => {
    const bundle = assembleAiContext(index, rels, { intent: "review", activeGoalId: "g1", module: "goals" }, { maxItems: 5 });
    expect(bundle.items.length).toBeLessThanOrEqual(5);
    expect(bundle.omittedCount).toBeGreaterThan(0);
    expect(bundle.note).toMatch(/minimum necessary/i);
  });

  it("only includes direct / high relevance items, never the whole index", () => {
    const bundle = assembleAiContext(index, rels, { intent: "review", activeGoalId: "g1", module: "goals" });
    expect(bundle.items.length).toBeLessThan(index.length);
  });
});

describe("explainRelevance", () => {
  it("produces a user-facing why-am-I-seeing-this string with the source date", () => {
    const index = buildContextIndex(sources({ goals: [goal({ id: "g1", title: "Certification" })] }));
    const [result] = queryContext(index, [], { now: NOW, activeGoalId: "g1" });
    expect(explainRelevance(result!)).toMatch(/goal, 2026-\d\d-\d\d/);
  });
});

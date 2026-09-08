import { describe, expect, it } from "vitest";
import type { Goal } from "@/features/goals/schema";
import type { Task } from "@/features/tasks/schema";
import type { TimeBlock } from "@/features/time-blocking/schema";
import {
  assessGoalTrajectory,
  assessHabitTrajectory,
  buildPredictions,
  confidenceFromSample,
  plannedMinutesForDate,
  rankPredictions,
  type HabitDay,
} from "./prediction-model";

const NOW = "2026-03-10T09:00:00.000Z";

function goal(over: Partial<Goal> & { id: string }): Goal {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: over.updatedAt ?? "2026-03-09T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    pillarIds: [],
    parentPlanId: null,
    startDate: over.startDate ?? null,
    targetDate: over.targetDate ?? null,
    goalStatus: over.goalStatus ?? "in-progress",
    priority: over.priority ?? "medium",
    progress: over.progress ?? 0,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "weekly",
    notes: "",
  } as Goal;
}

function task(over: Partial<Task> & { id: string }): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? over.id,
    description: "",
    taskStatus: over.taskStatus ?? "todo",
    priority: over.priority ?? "medium",
    startDate: null,
    dueDate: over.dueDate ?? null,
    pillarIds: [],
    goalId: over.goalId ?? null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: over.estimatedMinutes ?? 0,
    actualMinutes: 0,
    energyRequirement: "medium",
    context: "",
    tags: [],
    notes: "",
    completedAt: null,
    resolutionReason: "",
  } as Task;
}

function block(startIso: string, endIso: string, id = startIso): TimeBlock {
  return {
    id,
    status: "active",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: "Block",
    category: "deep-work",
    timeZone: "UTC",
    startDateTime: startIso,
    endDateTime: endIso,
    blockStatus: "planned",
    goalId: null,
    projectId: null,
    notes: "",
  } as unknown as TimeBlock;
}

const days = (spec: string): HabitDay[] =>
  [...spec].map((c) => ({
    state: c === "c" ? "completed" : c === "m" ? "missed" : "not-expected",
  }));

describe("confidenceFromSample", () => {
  it("bands sample size", () => {
    expect(confidenceFromSample(2)).toBe("limited");
    expect(confidenceFromSample(10)).toBe("moderate");
    expect(confidenceFromSample(30)).toBe("high");
  });
});

describe("assessGoalTrajectory", () => {
  it("is insufficient without both dates or a positive range", () => {
    expect(assessGoalTrajectory(goal({ id: "a" }), NOW).trajectory).toBe("insufficient");
    expect(
      assessGoalTrajectory(
        goal({ id: "b", startDate: "2026-03-10", targetDate: "2026-03-10" }),
        NOW,
      ).trajectory,
    ).toBe("insufficient");
  });

  it("compares progress against a linear pace", () => {
    // 10-day window, day 5 → expected ~50%.
    const base = { startDate: "2026-03-05", targetDate: "2026-03-15" };
    expect(assessGoalTrajectory(goal({ id: "onT", ...base, progress: 50 }), NOW).trajectory).toBe(
      "on-track",
    );
    expect(assessGoalTrajectory(goal({ id: "ahead", ...base, progress: 75 }), NOW).trajectory).toBe(
      "ahead",
    );
    expect(assessGoalTrajectory(goal({ id: "risk", ...base, progress: 20 }), NOW).trajectory).toBe(
      "at-risk",
    );
  });
});

describe("assessHabitTrajectory", () => {
  it("needs at least four expected days", () => {
    expect(assessHabitTrajectory(days("ccm"))).toBe("insufficient");
  });
  it("detects improving, declining, inconsistent and stable", () => {
    expect(assessHabitTrajectory(days("mmmmcccc"))).toBe("improving");
    expect(assessHabitTrajectory(days("ccccmmmm"))).toBe("declining");
    expect(assessHabitTrajectory(days("cmcmcmcm"))).toBe("inconsistent");
    expect(assessHabitTrajectory(days("cccccccc"))).toBe("stable");
  });
  it("ignores not-expected days", () => {
    expect(assessHabitTrajectory(days("c-c-c-c-"))).toBe("stable");
  });
});

describe("plannedMinutesForDate", () => {
  it("sums block durations on the matching local date only", () => {
    const blocks = [
      block("2026-03-11T08:00:00.000Z", "2026-03-11T10:00:00.000Z"),
      block("2026-03-11T14:00:00.000Z", "2026-03-11T15:30:00.000Z"),
      block("2026-03-12T09:00:00.000Z", "2026-03-12T11:00:00.000Z"),
    ];
    expect(plannedMinutesForDate(blocks, "2026-03-11")).toBe(210);
    expect(plannedMinutesForDate(blocks, "2026-03-12")).toBe(120);
  });
});

describe("buildPredictions", () => {
  const empty = { goals: [], tasks: [], blocks: [], habitWindows: [], nowIso: NOW };

  it("says nothing when there is nothing to say", () => {
    expect(buildPredictions(empty)).toEqual([]);
  });

  it("raises a deadline-risk signal for a near, behind goal — and none for an on-track one", () => {
    const behind = buildPredictions({
      ...empty,
      goals: [goal({ id: "g1", title: "Ship", targetDate: "2026-03-13", progress: 30 })],
      tasks: [task({ id: "t1", goalId: "g1", estimatedMinutes: 240 })],
    });
    expect(behind[0]?.category).toBe("deadline-risk");
    expect(behind[0]?.urgency).toBe("critical"); // 3 days out
    expect(behind[0]?.prediction).toMatch(/may need additional time/i);
    expect(behind[0]?.evidence.some((e) => /4h of estimated work/i.test(e))).toBe(true);

    const onTrack = buildPredictions({
      ...empty,
      goals: [
        goal({
          id: "g2",
          startDate: "2026-03-05",
          targetDate: "2026-06-05",
          progress: 90,
          goalStatus: "in-progress",
        }),
      ],
    });
    expect(onTrack).toEqual([]);
  });

  it("raises a schedule-overload signal for a heavy day", () => {
    const signals = buildPredictions({
      ...empty,
      blocks: [
        block("2026-03-10T06:00:00.000Z", "2026-03-10T12:00:00.000Z"),
        block("2026-03-10T13:00:00.000Z", "2026-03-10T15:00:00.000Z"),
      ],
    });
    expect(signals.some((s) => s.category === "schedule-overload")).toBe(true);
  });

  it("raises a goal-inactivity signal for a stale high-priority goal", () => {
    const signals = buildPredictions({
      ...empty,
      goals: [
        goal({
          id: "g3",
          title: "Portfolio",
          priority: "high",
          updatedAt: "2026-03-01T00:00:00.000Z",
        }),
      ],
    });
    const inactivity = signals.find((s) => s.category === "goal-inactivity");
    expect(inactivity).toBeDefined();
    expect(inactivity?.prediction).toMatch(/no recorded activity for 9 days/i);
  });
});

describe("rankPredictions", () => {
  it("orders critical before opportunity and caps to the limit", () => {
    const signals = buildPredictions({
      goals: [
        goal({ id: "gd", title: "Due soon", targetDate: "2026-03-12", progress: 10 }),
      ],
      tasks: [],
      blocks: [],
      habitWindows: [{ id: "h1", title: "Study", days: days("ccccmmmm") }],
      nowIso: NOW,
    });
    const ranked = rankPredictions(signals, 1);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.urgency).toBe("critical");
  });
});

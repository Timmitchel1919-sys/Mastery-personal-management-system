import { describe, expect, it } from "vitest";
import {
  averageEnergyLevel,
  classifyTasks,
  periodRange,
  summarizeHabitsForPeriod,
  summarizeRoutinesForPeriod,
} from "./execution-tracker";
import type { DeepWorkSession } from "@/features/deep-work/schema";
import type { Habit, HabitLog } from "@/features/habits/schema";
import type { Routine, RoutineLog } from "@/features/routines/schema";
import type { Task } from "@/features/tasks/schema";

describe("periodRange", () => {
  it("today is a single-day range", () => {
    expect(periodRange("today", "2026-09-10")).toEqual({ start: "2026-09-10", end: "2026-09-10" });
  });

  it("week spans the trailing 7 days including today", () => {
    expect(periodRange("week", "2026-09-10")).toEqual({ start: "2026-09-04", end: "2026-09-10" });
  });
});

function makeTask(over: Partial<Task> & Pick<Task, "id">): Task {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: over.updatedAt ?? "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "Task",
    description: "",
    taskStatus: over.taskStatus ?? "todo",
    priority: "medium",
    startDate: null,
    dueDate: over.dueDate ?? null,
    pillarIds: [],
    goalId: null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: over.estimatedMinutes ?? 30,
    actualMinutes: over.actualMinutes ?? 0,
    energyRequirement: "medium",
    context: "",
    tags: [],
    notes: "",
    completedAt: over.completedAt ?? null,
    resolutionReason: over.resolutionReason ?? "",
  };
}

const RANGE = { start: "2026-09-04", end: "2026-09-10" };
const TODAY = "2026-09-10";

describe("classifyTasks", () => {
  it("counts a task completed on or before its due date as on time", () => {
    const summary = classifyTasks(
      [
        makeTask({
          id: "a",
          taskStatus: "done",
          dueDate: "2026-09-06",
          completedAt: "2026-09-05T10:00:00.000Z",
          estimatedMinutes: 30,
          actualMinutes: 25,
        }),
      ],
      RANGE,
      TODAY,
    );
    expect(summary.completedOnTime).toBe(1);
    expect(summary.completedLater).toBe(0);
    expect(summary.estimatedMinutes).toBe(30);
    expect(summary.actualMinutes).toBe(25);
  });

  it("counts a task completed after its due date as completed later, with a note if a reason is recorded", () => {
    const summary = classifyTasks(
      [
        makeTask({
          id: "a",
          taskStatus: "done",
          dueDate: "2026-09-04",
          completedAt: "2026-09-06T10:00:00.000Z",
          resolutionReason: "Waited on a review",
        }),
      ],
      RANGE,
      TODAY,
    );
    expect(summary.completedLater).toBe(1);
    expect(summary.notes).toEqual([
      { id: "a", title: "Task", taskStatus: "done", reason: "Waited on a review" },
    ]);
  });

  it("counts a cancelled task updated in range, with its reason", () => {
    const summary = classifyTasks(
      [
        makeTask({
          id: "a",
          taskStatus: "cancelled",
          updatedAt: "2026-09-05T10:00:00.000Z",
          resolutionReason: "No longer needed",
        }),
      ],
      RANGE,
      TODAY,
    );
    expect(summary.cancelled).toBe(1);
    expect(summary.notes[0]?.reason).toBe("No longer needed");
  });

  it("splits open tasks due in range into overdue vs upcoming", () => {
    const summary = classifyTasks(
      [
        makeTask({ id: "a", dueDate: "2026-09-05" }), // before today -> overdue
        makeTask({ id: "b", dueDate: "2026-09-10" }), // today -> not overdue
      ],
      RANGE,
      TODAY,
    );
    expect(summary.overdue).toBe(1);
    expect(summary.upcoming).toBe(1);
  });

  it("ignores tasks with no date signal in the period", () => {
    const summary = classifyTasks([makeTask({ id: "a", dueDate: "2026-01-01" })], RANGE, TODAY);
    expect(summary).toMatchObject({ completedOnTime: 0, overdue: 0, upcoming: 0, cancelled: 0 });
  });
});

function makeHabit(over: Partial<Habit> & Pick<Habit, "id">): Habit {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: over.createdAt ?? "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: "Habit",
    description: "",
    pillarIds: ["personal"],
    goalId: null,
    frequency: "daily",
    interval: 1,
    weekdays: [],
    daysOfMonth: [],
    target: 1,
    unit: "",
    reminderTime: null,
    habitStatus: over.habitStatus ?? "active",
  };
}

function makeHabitLog(habitId: string, date: string, logStatus: HabitLog["logStatus"]): HabitLog {
  return {
    id: `${habitId}-${date}`,
    status: "active",
    version: 1,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    habitId,
    date,
    logStatus,
    value: 0,
    notes: "",
  };
}

describe("summarizeHabitsForPeriod", () => {
  it("sums expected-vs-completed daily occurrences across the range", () => {
    const habit = makeHabit({ id: "h1" });
    const logs = new Map([
      [
        "h1",
        [makeHabitLog("h1", "2026-09-04", "completed"), makeHabitLog("h1", "2026-09-05", "missed")],
      ],
    ]);
    const summary = summarizeHabitsForPeriod([habit], logs, RANGE);
    expect(summary.expected).toBe(7); // daily, 7-day range
    expect(summary.completed).toBe(1);
    expect(summary.notCompleted).toBe(6);
  });

  it("excludes paused habits", () => {
    const habit = makeHabit({ id: "h1", habitStatus: "paused" });
    const summary = summarizeHabitsForPeriod([habit], new Map(), RANGE);
    expect(summary).toEqual({ expected: 0, completed: 0, notCompleted: 0 });
  });
});

function makeRoutine(over: Partial<Routine> & Pick<Routine, "id">): Routine {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: "Routine",
    description: "",
    routineType: "morning",
    pillarIds: [],
    isTemplate: over.isTemplate ?? false,
    steps: over.steps ?? [{ id: "s1", title: "Step", estimatedMinutes: 10, habitId: null }],
  };
}

function makeRoutineLog(routineId: string, date: string, completedStepIds: string[]): RoutineLog {
  return {
    id: `${routineId}-${date}`,
    status: "active",
    version: 1,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    routineId,
    date,
    completedStepIds,
    notes: "",
  };
}

describe("summarizeRoutinesForPeriod", () => {
  it("sums step and minute completion across every day in the range", () => {
    const routine = makeRoutine({ id: "r1" });
    const logs = [makeRoutineLog("r1", "2026-09-04", ["s1"])];
    const summary = summarizeRoutinesForPeriod([routine], logs, RANGE);
    expect(summary.stepsExpected).toBe(7); // one step/day for 7 days
    expect(summary.stepsCompleted).toBe(1);
    expect(summary.minutesPlanned).toBe(70);
    expect(summary.minutesCompleted).toBe(10);
  });

  it("excludes templates", () => {
    const template = makeRoutine({ id: "r1", isTemplate: true });
    const summary = summarizeRoutinesForPeriod([template], [], RANGE);
    expect(summary).toEqual({
      stepsExpected: 0,
      stepsCompleted: 0,
      minutesPlanned: 0,
      minutesCompleted: 0,
    });
  });
});

function makeDeepWorkSession(
  over: Partial<Pick<DeepWorkSession, "sessionStatus" | "energyLevel">>,
): Pick<DeepWorkSession, "sessionStatus" | "energyLevel"> {
  return { sessionStatus: over.sessionStatus ?? "completed", energyLevel: over.energyLevel ?? 3 };
}

describe("averageEnergyLevel", () => {
  it("averages energy across completed sessions only", () => {
    expect(
      averageEnergyLevel([
        makeDeepWorkSession({ energyLevel: 4 }),
        makeDeepWorkSession({ energyLevel: 2 }),
        makeDeepWorkSession({ sessionStatus: "abandoned", energyLevel: 5 }),
      ]),
    ).toBe(3);
  });

  it("is null with no completed sessions", () => {
    expect(averageEnergyLevel([])).toBeNull();
  });
});

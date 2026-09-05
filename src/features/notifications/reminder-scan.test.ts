import { describe, expect, it } from "vitest";
import { computeDueReminders, type ReminderScanInput } from "./reminder-scan";

const DAY = "2026-09-05";

function baseInput(over: Partial<ReminderScanInput> = {}): ReminderScanInput {
  return {
    now: new Date(`${DAY}T09:00:00.000Z`),
    localDay: DAY,
    localTime: "09:00",
    prefs: {
      categories: { updates: true, tasks: true, habits: true, planning: true, kpis: true },
      milestoneLeadDays: 7,
      kpiStaleDays: 14,
    },
    tasks: [],
    milestones: [],
    habits: [],
    habitLogs: [],
    kpis: [],
    kpiEntries: [],
    goals: [],
    ...over,
  };
}

describe("computeDueReminders", () => {
  it("flags a task due today and an overdue task, but not done/cancelled/future ones", () => {
    const seeds = computeDueReminders(
      baseInput({
        tasks: [
          { id: "t1", title: "Ship", taskStatus: "todo", dueDate: DAY },
          { id: "t2", title: "Email", taskStatus: "in-progress", dueDate: "2026-09-01" },
          { id: "t3", title: "Later", taskStatus: "todo", dueDate: "2026-09-30" },
          { id: "t4", title: "Done", taskStatus: "done", dueDate: DAY },
        ],
      }),
    );
    const byId = Object.fromEntries(seeds.map((s) => [s.relatedId, s]));
    expect(byId.t1?.title).toBe("Due today: Ship");
    expect(byId.t2?.title).toBe("Overdue: Email");
    expect(byId.t3).toBeUndefined();
    expect(byId.t4).toBeUndefined();
    expect(byId.t1?.dedupeKey).toBe(`task-due:t1:${DAY}`);
  });

  it("flags a milestone inside the lead window only", () => {
    const seeds = computeDueReminders(
      baseInput({
        milestones: [
          { id: "m1", title: "Beta", milestoneStatus: "upcoming", dueDate: "2026-09-09" },
          { id: "m2", title: "GA", milestoneStatus: "upcoming", dueDate: "2026-10-30" },
          { id: "m3", title: "Old", milestoneStatus: "done", dueDate: "2026-09-06" },
        ],
      }),
    );
    expect(seeds.map((s) => s.relatedId)).toEqual(["m1"]);
  });

  it("flags a habit only after its reminder time and only if not logged today", () => {
    const habits = [
      { id: "h1", title: "Read", habitStatus: "active", reminderTime: "08:00" },
      { id: "h2", title: "Run", habitStatus: "active", reminderTime: "20:00" },
      { id: "h3", title: "Meditate", habitStatus: "active", reminderTime: "07:00" },
    ];
    const seeds = computeDueReminders(
      baseInput({
        habits,
        habitLogs: [{ habitId: "h3", logStatus: "completed", date: DAY }],
      }),
    );
    expect(seeds.map((s) => s.relatedId)).toEqual(["h1"]); // h2 not yet due, h3 already logged
  });

  it("flags a KPI with no reading in the stale window", () => {
    const seeds = computeDueReminders(
      baseInput({
        kpis: [
          { id: "k1", title: "Weight" },
          { id: "k2", title: "Savings" },
        ],
        kpiEntries: [
          { kpiId: "k1", date: "2026-09-03" }, // fresh
          { kpiId: "k2", date: "2026-08-01" }, // stale (> 14d)
        ],
      }),
    );
    expect(seeds.map((s) => s.relatedId)).toEqual(["k2"]);
  });

  it("flags a goal review overdue for its cadence", () => {
    const seeds = computeDueReminders(
      baseInput({
        goals: [
          {
            id: "g1",
            title: "Launch",
            goalStatus: "in-progress",
            reviewFrequency: "weekly",
            updatedAt: "2026-08-20T10:00:00.000Z",
          },
          {
            id: "g2",
            title: "Fresh",
            goalStatus: "in-progress",
            reviewFrequency: "weekly",
            updatedAt: "2026-09-04T10:00:00.000Z",
          },
          {
            id: "g3",
            title: "No cadence",
            goalStatus: "in-progress",
            reviewFrequency: "none",
            updatedAt: "2020-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    expect(seeds.map((s) => s.relatedId)).toEqual(["g1"]);
  });

  it("respects category preferences", () => {
    const seeds = computeDueReminders(
      baseInput({
        prefs: {
          categories: { updates: true, tasks: false, habits: true, planning: true, kpis: true },
          milestoneLeadDays: 7,
          kpiStaleDays: 14,
        },
        tasks: [{ id: "t1", title: "Ship", taskStatus: "todo", dueDate: DAY }],
      }),
    );
    expect(seeds).toEqual([]);
  });
});

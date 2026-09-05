import { describe, expect, it } from "vitest";
import { weeklySummarySchema } from "./schema";

const full = {
  id: "s1",
  weekStart: "2026-08-31",
  weekEnd: "2026-09-07",
  goalsCompleted: ["Ship v1"],
  milestonesCompleted: [],
  tasksCompleted: 5,
  tasksCompletedOnTime: 4,
  tasksCompletedLate: 1,
  tasksCancelled: 0,
  tasksStillOverdue: 1,
  habitConsistencyPercent: 80,
  focusMinutes: 240,
  kpiMovements: [{ title: "Sleep hours", from: 6, to: 8 }],
  lessons: ["You kept a strong focus streak."],
  suggestedPriorities: ["Follow up on the overdue task."],
  status: "active",
  version: 1,
  createdAt: "2026-09-07T01:00:00.000Z",
  updatedAt: "2026-09-07T01:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

describe("weeklySummarySchema", () => {
  it("validates a fully specified stored record", () => {
    const parsed = weeklySummarySchema.parse(full);
    expect(parsed.weekStart).toBe("2026-08-31");
    expect(parsed.kpiMovements[0]).toEqual({ title: "Sleep hours", from: 6, to: 8 });
  });

  it("allows a null habitConsistencyPercent and a null kpi 'from'", () => {
    const parsed = weeklySummarySchema.parse({
      ...full,
      habitConsistencyPercent: null,
      kpiMovements: [{ title: "Sleep hours", from: null, to: 8 }],
    });
    expect(parsed.habitConsistencyPercent).toBeNull();
    expect(parsed.kpiMovements[0]?.from).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const lists = vi.hoisted(() => ({
  goal: vi.fn(),
  milestone: vi.fn(),
  task: vi.fn(),
  habit: vi.fn(),
  habitLog: vi.fn(),
  deepWork: vi.fn(),
  kpi: vi.fn(),
  kpiEntry: vi.fn(),
}));

vi.mock("@/features/goals/goal-repository", () => ({ goalRepository: { list: lists.goal } }));
vi.mock("@/features/milestones/milestone-repository", () => ({
  milestoneRepository: { list: lists.milestone },
}));
vi.mock("@/features/tasks/task-repository", () => ({ taskRepository: { list: lists.task } }));
vi.mock("@/features/habits/habit-repository", () => ({ habitRepository: { list: lists.habit } }));
vi.mock("@/features/habits/habit-log-repository", () => ({
  habitLogRepository: { list: lists.habitLog },
}));
vi.mock("@/features/deep-work/deep-work-repository", () => ({
  deepWorkRepository: { list: lists.deepWork },
}));
vi.mock("@/features/kpis/kpi-repository", () => ({ kpiRepository: { list: lists.kpi } }));
vi.mock("@/features/kpis/kpi-entry-repository", () => ({
  kpiEntryRepository: { list: lists.kpiEntry },
}));

import { buildReportData } from "./report-data";

const RANGE = { start: "2026-09-01", end: "2026-09-07" };
const audit = {
  status: "active",
  version: 1,
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

function page<T>(items: T[]) {
  return Promise.resolve({ items, nextCursor: null, hasMore: false });
}

beforeEach(() => {
  Object.values(lists).forEach((fn) =>
    fn.mockReset().mockResolvedValue({ items: [], nextCursor: null, hasMore: false }),
  );
});

describe("buildReportData", () => {
  it("only computes the sections that were requested", async () => {
    const data = await buildReportData(RANGE, ["focus"]);
    expect(data.focus).not.toBeNull();
    expect(data.summary).toBeNull();
    expect(data.goals).toBeNull();
    expect(data.kpis).toBeNull();
    // goals/kpi repos are not read when only "focus" is asked for
    expect(lists.goal).not.toHaveBeenCalled();
    expect(lists.kpi).not.toHaveBeenCalled();
    expect(lists.deepWork).toHaveBeenCalledOnce();
  });

  it("filters goals and milestones to those completed inside the range", async () => {
    lists.goal.mockReturnValue(
      page([
        {
          ...audit,
          id: "g1",
          title: "Shipped v1",
          goalStatus: "achieved",
          progress: 100,
          updatedAt: "2026-09-03T09:00:00.000Z",
        },
        {
          ...audit,
          id: "g2",
          title: "Old win",
          goalStatus: "achieved",
          progress: 100,
          updatedAt: "2026-07-01T09:00:00.000Z",
        },
        {
          ...audit,
          id: "g3",
          title: "In flight",
          goalStatus: "in-progress",
          progress: 40,
          updatedAt: "2026-09-04T09:00:00.000Z",
        },
      ]),
    );
    lists.milestone.mockReturnValue(
      page([
        {
          ...audit,
          id: "m1",
          title: "Beta",
          milestoneStatus: "done",
          updatedAt: "2026-09-02T09:00:00.000Z",
        },
      ]),
    );

    const data = await buildReportData(RANGE, ["summary", "goals"]);
    expect(data.goals?.achieved).toEqual([{ title: "Shipped v1" }]);
    expect(data.goals?.inProgress).toEqual([{ title: "In flight", progress: 40 }]);
    expect(data.goals?.milestonesCompleted).toEqual([{ title: "Beta" }]);
    expect(data.summary?.goalsAchieved).toBe(1);
    expect(data.summary?.milestonesCompleted).toBe(1);
  });

  it("computes per-habit consistency over the range's day span", async () => {
    lists.habit.mockReturnValue(page([{ ...audit, id: "h1", title: "Read" }]));
    lists.habitLog.mockReturnValue(
      page([
        { ...audit, id: "l1", habitId: "h1", logStatus: "completed", date: "2026-09-01" },
        { ...audit, id: "l2", habitId: "h1", logStatus: "completed", date: "2026-09-02" },
        { ...audit, id: "l3", habitId: "h1", logStatus: "missed", date: "2026-09-03" },
        { ...audit, id: "l4", habitId: "h1", logStatus: "completed", date: "2026-08-25" },
      ]),
    );
    const data = await buildReportData(RANGE, ["habits"]);
    // 7-day span, 2 completions in range
    expect(data.habits?.perHabit).toEqual([
      { title: "Read", completed: 2, expected: 7, percent: 29 },
    ]);
    expect(data.habits?.overallPercent).toBe(29);
  });

  it("returns null habit consistency when there are no active habits", async () => {
    const data = await buildReportData(RANGE, ["summary", "habits"]);
    expect(data.habits?.overallPercent).toBeNull();
    expect(data.summary?.habitConsistencyPercent).toBeNull();
  });

  it("sums focus minutes and reports the longest session in range", async () => {
    lists.deepWork.mockReturnValue(
      page([
        { ...audit, id: "f1", startedAt: "2026-09-02T09:00", actualMinutes: 50 },
        { ...audit, id: "f2", startedAt: "2026-09-04T14:00", actualMinutes: 90 },
        { ...audit, id: "f3", startedAt: "2026-08-01T14:00", actualMinutes: 200 },
      ]),
    );
    const data = await buildReportData(RANGE, ["focus"]);
    expect(data.focus).toMatchObject({
      totalMinutes: 140,
      sessionCount: 2,
      longestMinutes: 90,
      averageMinutes: 70,
    });
  });

  it("reports each KPI's first and last reading in the range", async () => {
    lists.kpi.mockReturnValue(
      page([{ ...audit, id: "k1", title: "Weight", unit: "kg", direction: "lower-is-better" }]),
    );
    lists.kpiEntry.mockReturnValue(
      page([
        { ...audit, id: "e1", kpiId: "k1", date: "2026-09-01", value: 80 },
        { ...audit, id: "e2", kpiId: "k1", date: "2026-09-06", value: 78.5 },
        { ...audit, id: "e3", kpiId: "k1", date: "2026-08-01", value: 82 },
      ]),
    );
    const data = await buildReportData(RANGE, ["kpis"]);
    expect(data.kpis).toEqual([
      {
        title: "Weight",
        unit: "kg",
        direction: "lower-is-better",
        from: 80,
        to: 78.5,
        change: -1.5,
      },
    ]);
  });

  it("splits task completions into on-time / late / cancelled / overdue", async () => {
    lists.task.mockReturnValue(
      page([
        {
          ...audit,
          id: "t1",
          taskStatus: "done",
          completedAt: "2026-09-02T10:00",
          dueDate: "2026-09-03",
          updatedAt: "2026-09-02T10:00:00.000Z",
        },
        {
          ...audit,
          id: "t2",
          taskStatus: "done",
          completedAt: "2026-09-05T10:00",
          dueDate: "2026-09-03",
          updatedAt: "2026-09-05T10:00:00.000Z",
        },
        {
          ...audit,
          id: "t3",
          taskStatus: "cancelled",
          completedAt: null,
          dueDate: null,
          updatedAt: "2026-09-04T10:00:00.000Z",
        },
        {
          ...audit,
          id: "t4",
          taskStatus: "todo",
          completedAt: null,
          dueDate: "2026-09-01",
          updatedAt: "2026-08-01T10:00:00.000Z",
        },
      ]),
    );
    const data = await buildReportData(RANGE, ["summary", "planning"]);
    expect(data.planning).toEqual({
      completedOnTime: 1,
      completedLate: 1,
      cancelled: 1,
      stillOverdue: 1,
    });
    expect(data.summary?.tasksCompleted).toBe(2);
  });
});

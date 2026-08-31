import { describe, expect, it } from "vitest";
import { summarizeSessions } from "./pomodoro-stats";
import type { PomodoroSession } from "./schema";

const base = {
  status: "active" as const,
  version: 1,
  createdAt: "2026-08-31T10:00:00.000Z",
  updatedAt: "2026-08-31T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  label: "",
  goalId: null,
  projectId: null,
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  plannedCycles: 4,
  notes: "",
};

function session(over: Partial<PomodoroSession>): PomodoroSession {
  return {
    id: Math.random().toString(36).slice(2),
    ...base,
    outcome: "completed",
    completedWorkIntervals: 4,
    focusMinutes: 100,
    startedAt: "2026-08-31T09:00:00.000Z",
    endedAt: "2026-08-31T11:00:00.000Z",
    ...over,
  };
}

describe("summarizeSessions", () => {
  it("returns zeroes for no sessions", () => {
    expect(summarizeSessions([])).toEqual({
      sessions: 0,
      completed: 0,
      abandoned: 0,
      focusMinutes: 0,
      workIntervals: 0,
      avgFocusMinutes: 0,
      todayFocusMinutes: 0,
    });
  });

  it("aggregates focus time, intervals, and outcomes", () => {
    const now = new Date("2026-08-31T12:30:00.000Z");
    const stats = summarizeSessions(
      [
        session({
          focusMinutes: 50,
          completedWorkIntervals: 2,
          startedAt: "2026-08-31T12:00:00.000Z",
        }),
        session({
          focusMinutes: 30,
          completedWorkIntervals: 1,
          outcome: "abandoned",
          startedAt: "2026-08-30T12:00:00.000Z",
        }),
      ],
      now,
    );
    expect(stats.sessions).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.abandoned).toBe(1);
    expect(stats.focusMinutes).toBe(80);
    expect(stats.workIntervals).toBe(3);
    expect(stats.avgFocusMinutes).toBe(40);
    expect(stats.todayFocusMinutes).toBe(50);
  });
});

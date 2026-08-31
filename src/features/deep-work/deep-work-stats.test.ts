import { describe, expect, it } from "vitest";
import { summarizeDeepWork } from "./deep-work-stats";
import type { DeepWorkSession } from "./schema";

const audit = {
  status: "active" as const,
  version: 1,
  createdAt: "2026-08-31T10:00:00.000Z",
  updatedAt: "2026-08-31T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

function session(over: Partial<DeepWorkSession>): DeepWorkSession {
  return {
    id: Math.random().toString(36).slice(2),
    ...audit,
    title: "Session",
    intendedOutcome: "",
    goalId: null,
    projectId: null,
    plannedMinutes: 60,
    startedAt: "2026-08-31T09:00",
    endedAt: "2026-08-31T10:00",
    actualMinutes: 60,
    energyLevel: 4,
    focusQuality: 4,
    distractions: [],
    completionNotes: "",
    sessionStatus: "completed",
    ...over,
  };
}

describe("summarizeDeepWork", () => {
  it("returns zeroes for no sessions", () => {
    const stats = summarizeDeepWork([]);
    expect(stats).toMatchObject({
      sessions: 0,
      completed: 0,
      focusMinutes: 0,
      distractions: 0,
      avgScore: null,
      avgFocusQuality: null,
      last7DaysMinutes: 0,
    });
  });

  it("counts only completed sessions toward focus time and averages", () => {
    const now = new Date("2026-09-02T12:00:00.000Z");
    const stats = summarizeDeepWork(
      [
        session({ actualMinutes: 90, focusQuality: 5, startedAt: "2026-09-01T09:00" }),
        session({ actualMinutes: 60, focusQuality: 3, startedAt: "2026-09-02T09:00" }),
        session({ sessionStatus: "planned", actualMinutes: 45, distractions: ["x"] }),
      ],
      now,
    );
    expect(stats.sessions).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.focusMinutes).toBe(150);
    expect(stats.avgFocusQuality).toBe(4);
    expect(stats.avgScore).not.toBeNull();
    expect(stats.distractions).toBe(1);
    expect(stats.last7DaysMinutes).toBe(150);
  });

  it("excludes sessions older than 7 days from the recent window", () => {
    const now = new Date("2026-09-10T12:00:00.000Z");
    const stats = summarizeDeepWork(
      [session({ actualMinutes: 120, startedAt: "2026-09-01T09:00" })],
      now,
    );
    expect(stats.focusMinutes).toBe(120);
    expect(stats.last7DaysMinutes).toBe(0);
  });
});

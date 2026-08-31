import { describe, expect, it } from "vitest";
import {
  DEFAULT_POMODORO_CONFIG,
  pomodoroConfigSchema,
  pomodoroLiveStateSchema,
  pomodoroSessionCreateSchema,
  pomodoroSessionSchema,
} from "./schema";

const config = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  plannedCycles: 4,
  label: "Deep work",
  goalId: null,
  projectId: null,
};

describe("pomodoroConfigSchema", () => {
  it("accepts the default config", () => {
    expect(pomodoroConfigSchema.safeParse({ ...DEFAULT_POMODORO_CONFIG }).success).toBe(true);
  });

  it("enforces bounds on every interval", () => {
    expect(pomodoroConfigSchema.safeParse({ ...config, workMinutes: 0 }).success).toBe(false);
    expect(pomodoroConfigSchema.safeParse({ ...config, workMinutes: 999 }).success).toBe(false);
    expect(pomodoroConfigSchema.safeParse({ ...config, plannedCycles: 0 }).success).toBe(false);
    expect(pomodoroConfigSchema.safeParse({ ...config, shortBreakMinutes: 1.5 }).success).toBe(
      false,
    );
  });

  it("allows null goal / project links", () => {
    expect(
      pomodoroConfigSchema.safeParse({ ...config, goalId: null, projectId: "p1" }).success,
    ).toBe(true);
    expect(pomodoroConfigSchema.safeParse({ ...config, goalId: "" }).success).toBe(false);
  });
});

describe("pomodoroLiveStateSchema", () => {
  const live = {
    phase: "work" as const,
    running: true,
    phaseEndsAt: 1_700_000_000_000,
    remainingMs: 1_200_000,
    cyclesDone: 1,
    focusMs: 1_500_000,
    startedAt: "2026-08-31T09:00:00.000Z",
    config,
  };

  it("round-trips a plausible persisted blob", () => {
    expect(pomodoroLiveStateSchema.safeParse(live).success).toBe(true);
  });

  it("rejects a negative remaining time or an unknown phase", () => {
    expect(pomodoroLiveStateSchema.safeParse({ ...live, remainingMs: -1 }).success).toBe(false);
    expect(pomodoroLiveStateSchema.safeParse({ ...live, phase: "coffee" }).success).toBe(false);
  });
});

describe("pomodoroSessionCreateSchema", () => {
  const session = {
    label: "Write the report",
    goalId: null,
    projectId: null,
    outcome: "completed" as const,
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    plannedCycles: 4,
    completedWorkIntervals: 4,
    focusMinutes: 100,
    startedAt: "2026-08-31T09:00:00.000Z",
    endedAt: "2026-08-31T11:10:00.000Z",
    notes: "",
  };

  it("accepts a well-formed session", () => {
    expect(pomodoroSessionCreateSchema.safeParse(session).success).toBe(true);
  });

  it("requires a known outcome and non-negative counters", () => {
    expect(pomodoroSessionCreateSchema.safeParse({ ...session, outcome: "paused" }).success).toBe(
      false,
    );
    expect(
      pomodoroSessionCreateSchema.safeParse({ ...session, completedWorkIntervals: -1 }).success,
    ).toBe(false);
  });

  it("validates a stored record via pomodoroSessionSchema", () => {
    const record = pomodoroSessionSchema.parse({
      id: "s1",
      ...session,
      status: "active",
      version: 1,
      createdAt: "2026-08-31T11:10:00.000Z",
      updatedAt: "2026-08-31T11:10:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.outcome).toBe("completed");
  });
});

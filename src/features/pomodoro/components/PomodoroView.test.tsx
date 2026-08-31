import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type { PomodoroSnapshot } from "../pomodoro-store";
import type { PomodoroSession } from "../schema";

const start = vi.fn();
const pause = vi.fn();
const resume = vi.fn();
const skip = vi.fn();
const cancel = vi.fn();
const reload = vi.fn();

let pomodoro: {
  state: PomodoroSnapshot;
  start: typeof start;
  pause: typeof pause;
  resume: typeof resume;
  skip: typeof skip;
  cancel: typeof cancel;
};
let history: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/pomodoro" }));
vi.mock("../use-pomodoro", () => ({ usePomodoro: () => pomodoro }));
vi.mock("../use-pomodoro-history", () => ({ usePomodoroHistory: () => history }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [], loading: false }),
}));
vi.mock("@/features/projects", async (importOriginal) => ({
  ...(await importOriginal<typeof ProjectsModule>()),
  useProjectOptions: () => ({ options: [], loading: false }),
}));

import { PomodoroView } from "./PomodoroView";

const config = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  plannedCycles: 4,
  label: "",
  goalId: null,
  projectId: null,
};

function snapshot(over: Partial<PomodoroSnapshot> = {}): PomodoroSnapshot {
  return {
    phase: "idle",
    running: false,
    phaseEndsAt: null,
    remainingMs: 25 * 60_000,
    cyclesDone: 0,
    focusMs: 0,
    startedAt: null,
    config,
    displayRemainingMs: 25 * 60_000,
    phaseProgress: 0,
    pendingCompletion: null,
    ...over,
  };
}

const doneSession: PomodoroSession = {
  id: "s1",
  status: "active",
  version: 1,
  createdAt: "2026-08-31T11:00:00.000Z",
  updatedAt: "2026-08-31T11:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  label: "Write the report",
  goalId: null,
  projectId: null,
  outcome: "completed",
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  plannedCycles: 4,
  completedWorkIntervals: 4,
  focusMinutes: 100,
  startedAt: "2026-08-31T09:00:00.000Z",
  endedAt: "2026-08-31T11:00:00.000Z",
  notes: "",
};

beforeEach(() => {
  [start, pause, resume, skip, cancel, reload].forEach((fn) => fn.mockReset());
  pomodoro = { state: snapshot(), start, pause, resume, skip, cancel };
  history = { status: "ready", sessions: [], stats: summarize(0), error: null, reload };
});

function summarize(sessions: number) {
  return {
    sessions,
    completed: sessions,
    abandoned: 0,
    focusMinutes: 0,
    workIntervals: 0,
    avgFocusMinutes: 0,
    todayFocusMinutes: 0,
  };
}

describe("PomodoroView", () => {
  it("shows the setup form when idle and starts a session", async () => {
    render(<PomodoroView />);
    expect(screen.getByLabelText("Focus on")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /start focus session/i }));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("shows the running timer with a pause control", async () => {
    pomodoro.state = snapshot({
      phase: "work",
      running: true,
      displayRemainingMs: 20 * 60_000,
      phaseProgress: 0.2,
      cyclesDone: 1,
    });
    render(<PomodoroView />);
    expect(screen.getByText("20:00")).toBeInTheDocument();
    expect(screen.getByText(/1 of 4 focus intervals done/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("renders recent sessions", () => {
    history.sessions = [doneSession];
    history.stats = summarize(1);
    render(<PomodoroView />);
    expect(screen.getByText("Write the report")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders a history error with retry", async () => {
    history = { status: "error", sessions: [], stats: summarize(0), error: "boom", reload };
    render(<PomodoroView />);
    expect(screen.getByText("We couldn't load your focus history")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

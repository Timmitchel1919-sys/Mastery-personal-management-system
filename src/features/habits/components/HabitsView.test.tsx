import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { Habit, HabitLog } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const setDayStatus = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/act/habits" }));
vi.mock("@/hooks/use-mounted", () => ({ useMounted: () => true }));
vi.mock("../use-habits", () => ({ useHabits: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({
    options: [{ id: "goal-1", title: "Grow in faith" }],
    loading: false,
  }),
}));

import { HabitsView } from "./HabitsView";

const emptyStats = {
  activeHabits: 0,
  pausedHabits: 0,
  dueToday: 0,
  completedToday: 0,
  bestCurrentStreak: 0,
};

const habit: Habit = {
  id: "h1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Morning prayer",
  description: "",
  pillarIds: ["spiritual"],
  goalId: "goal-1",
  frequency: "daily",
  interval: 1,
  weekdays: [],
  daysOfMonth: [],
  target: 1,
  unit: "session",
  reminderTime: "06:30",
  habitStatus: "active",
};

const log: HabitLog = {
  id: "l1",
  status: "active",
  version: 1,
  createdAt: "2026-09-02T08:00:00.000Z",
  updatedAt: "2026-09-02T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  habitId: "h1",
  date: new Date().toISOString().slice(0, 10),
  logStatus: "completed",
  value: 0,
  notes: "",
};

beforeEach(() => {
  [reload, create, update, archive, setDayStatus].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    habits: [],
    logsByHabit: new Map(),
    streaksByHabit: new Map(),
    recentDaysByHabit: new Map(),
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    setDayStatus,
  };
});

describe("HabitsView", () => {
  it("shows the empty state", () => {
    render(<HabitsView />);
    expect(screen.getByText("No habits yet")).toBeInTheDocument();
  });

  it("renders a habit card with schedule, streak, link, and today's log state", () => {
    hookValue.habits = [habit];
    hookValue.logsByHabit = new Map([["h1", [log]]]);
    hookValue.streaksByHabit = new Map([["h1", { currentStreak: 3, longestStreak: 5 }]]);
    hookValue.recentDaysByHabit = new Map([
      ["h1", [{ date: log.date, state: "completed" as const }]],
    ]);
    hookValue.stats = { ...emptyStats, activeHabits: 1, dueToday: 1, completedToday: 1 };
    render(<HabitsView />);

    expect(screen.getByRole("heading", { name: "Morning prayer" })).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("3 streak")).toBeInTheDocument();
    expect(screen.getByText("Grow in faith")).toBeInTheDocument();
    // Today already logged completed -> the "Done today" button reflects the active state.
    expect(screen.getByRole("button", { name: /done today/i })).toBeInTheDocument();
  });

  it("logs today as done from the card", async () => {
    hookValue.habits = [habit];
    render(<HabitsView />);
    await userEvent.click(screen.getByRole("button", { name: /done today/i }));
    expect(setDayStatus).toHaveBeenCalledWith("h1", expect.any(String), "completed");
  });

  it("opens the new-habit dialog", async () => {
    render(<HabitsView />);
    await userEvent.click(screen.getByRole("button", { name: /new habit/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<HabitsView />);
    expect(screen.getByText("We couldn't load your habits")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as HabitsModule from "@/features/habits";
import type { Routine } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const duplicateTemplate = vi.fn();
const toggleStep = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/act/routine" }));
vi.mock("../use-routines", () => ({ useRoutines: () => hookValue }));
vi.mock("@/features/habits", async (importOriginal) => ({
  ...(await importOriginal<typeof HabitsModule>()),
  useHabitOptions: () => ({
    options: [{ id: "habit-1", title: "Morning prayer" }],
    loading: false,
  }),
}));

import { RoutinesView } from "./RoutinesView";

const emptyStats = {
  activeRoutines: 0,
  templates: 0,
  stepsCompletedToday: 0,
  stepsTotalToday: 0,
  minutesPlannedToday: 0,
};

const routine: Routine = {
  id: "r1",
  status: "active",
  version: 1,
  createdAt: "2026-09-02T08:00:00.000Z",
  updatedAt: "2026-09-02T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Morning routine",
  description: "",
  routineType: "morning",
  pillarIds: [],
  isTemplate: false,
  steps: [
    { id: "s1", title: "Pray", estimatedMinutes: 10, habitId: "habit-1" },
    { id: "s2", title: "Stretch", estimatedMinutes: 5, habitId: null },
  ],
};

const template: Routine = { ...routine, id: "r2", title: "Evening template", isTemplate: true };

beforeEach(() => {
  [reload, create, update, archive, duplicateTemplate, toggleStep].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    routines: [],
    todayLogByRoutine: new Map(),
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    duplicateTemplate,
    toggleStep,
  };
});

describe("RoutinesView", () => {
  it("shows the empty state", () => {
    render(<RoutinesView />);
    expect(screen.getByText("No routines yet")).toBeInTheDocument();
  });

  it("renders a routine under 'Your routines' with its steps and linked habit", async () => {
    hookValue.routines = [routine];
    hookValue.stats = { ...emptyStats, activeRoutines: 1, stepsTotalToday: 2 };
    render(<RoutinesView />);

    expect(screen.getByText("Your routines")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Morning routine" })).toBeInTheDocument();
    expect(screen.getByText("Pray")).toBeInTheDocument();
    expect(screen.getByText("Morning prayer")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: /pray/i }));
    expect(toggleStep).toHaveBeenCalledWith("r1", "s1");
  });

  it("renders a template under 'Templates' and can duplicate it", async () => {
    hookValue.routines = [template];
    hookValue.stats = { ...emptyStats, templates: 1 };
    render(<RoutinesView />);

    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evening template" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /pray/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /use this template/i }));
    expect(duplicateTemplate).toHaveBeenCalledWith(template);
  });

  it("opens the new-routine dialog", async () => {
    render(<RoutinesView />);
    await userEvent.click(screen.getByRole("button", { name: /new routine/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<RoutinesView />);
    expect(screen.getByText("We couldn't load your routines")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

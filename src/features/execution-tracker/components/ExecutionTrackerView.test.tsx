import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reload = vi.fn();
const setPeriod = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/act/execution" }));
vi.mock("../use-execution-tracker", () => ({ useExecutionTracker: () => hookValue }));

import { ExecutionTrackerView } from "./ExecutionTrackerView";

const emptySummary = {
  period: "week" as const,
  range: { start: "2026-09-04", end: "2026-09-10" },
  tasks: {
    completedOnTime: 0,
    completedLater: 0,
    cancelled: 0,
    overdue: 0,
    upcoming: 0,
    estimatedMinutes: 0,
    actualMinutes: 0,
    notes: [] as { id: string; title: string; taskStatus: string; reason: string }[],
  },
  habits: { expected: 0, completed: 0, notCompleted: 0 },
  routines: { stepsExpected: 0, stepsCompleted: 0, minutesPlanned: 0, minutesCompleted: 0 },
};

const emptyFocusEnergy = { avgFocusQuality: null, avgEnergyLevel: null, focusMinutesLast7Days: 0 };

beforeEach(() => {
  reload.mockReset();
  setPeriod.mockReset();
  hookValue = {
    status: "ready",
    error: null,
    period: "week",
    setPeriod,
    summary: emptySummary,
    focusEnergy: emptyFocusEnergy,
    reload,
  };
});

describe("ExecutionTrackerView", () => {
  it("renders all four sections with zeroed stats", () => {
    render(<ExecutionTrackerView />);
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Habits")).toBeInTheDocument();
    expect(screen.getByText("Routines")).toBeInTheDocument();
    expect(screen.getByText("Focus & energy")).toBeInTheDocument();
    expect(screen.getByText("Completed on time")).toBeInTheDocument();
  });

  it("shows task counts and a non-completion note when one is recorded", () => {
    hookValue.summary = {
      ...emptySummary,
      tasks: {
        ...emptySummary.tasks,
        overdue: 2,
        notes: [
          {
            id: "t1",
            title: "File the report",
            taskStatus: "cancelled",
            reason: "No longer needed",
          },
        ],
      },
    };
    render(<ExecutionTrackerView />);
    expect(screen.getByText("File the report")).toBeInTheDocument();
    expect(screen.getByText(/No longer needed/)).toBeInTheDocument();
  });

  it("shows focus and energy averages when present", () => {
    hookValue.focusEnergy = { avgFocusQuality: 4, avgEnergyLevel: 3.5, focusMinutesLast7Days: 120 };
    render(<ExecutionTrackerView />);
    expect(screen.getByText("4/5")).toBeInTheDocument();
    expect(screen.getByText("3.5/5")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<ExecutionTrackerView />);
    expect(screen.getByText("We couldn't load your execution summary")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

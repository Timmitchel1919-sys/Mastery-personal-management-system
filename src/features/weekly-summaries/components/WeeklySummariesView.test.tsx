import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WeeklySummary } from "../schema";

const reload = vi.fn();
const archive = vi.fn();
const remove = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/grow/ai-coach" }));
vi.mock("../use-weekly-summaries", () => ({ useWeeklySummaries: () => hookValue }));

import { WeeklySummariesView } from "./WeeklySummariesView";

const summary: WeeklySummary = {
  id: "s1",
  status: "active",
  version: 1,
  createdAt: "2026-09-07T01:00:00.000Z",
  updatedAt: "2026-09-07T01:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
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
};

beforeEach(() => {
  [reload, archive, remove].forEach((fn) => fn.mockReset());
  hookValue = { status: "ready", items: [], error: null, reload, archive, remove };
});

describe("WeeklySummariesView", () => {
  it("shows the empty state with no summaries", () => {
    render(<WeeklySummariesView />);
    expect(screen.getByText("No weekly summaries yet")).toBeInTheDocument();
  });

  it("renders a summary card with stats, lessons, and suggested priorities", () => {
    hookValue.items = [summary];
    render(<WeeklySummariesView />);

    expect(screen.getByText("2026-08-31 – 2026-09-07")).toBeInTheDocument();
    expect(screen.getByText("You kept a strong focus streak.")).toBeInTheDocument();
    expect(screen.getByText("Follow up on the overdue task.")).toBeInTheDocument();
    expect(screen.getByText("Ship v1")).toBeInTheDocument();
  });

  it("archives a summary", async () => {
    hookValue.items = [summary];
    render(<WeeklySummariesView />);
    await userEvent.click(screen.getByRole("button", { name: /archive summary/i }));
    expect(archive).toHaveBeenCalledWith("s1");
  });

  it("deletes a summary after confirming", async () => {
    hookValue.items = [summary];
    render(<WeeklySummariesView />);
    await userEvent.click(screen.getByRole("button", { name: /delete summary/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^delete$/i }));
    expect(remove).toHaveBeenCalledWith("s1");
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<WeeklySummariesView />);
    expect(screen.getByText("We couldn't load your weekly summaries")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

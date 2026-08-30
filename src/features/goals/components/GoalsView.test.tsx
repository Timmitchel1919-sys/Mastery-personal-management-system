import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as PlansModule from "@/features/plans";
import type { Goal } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/goals" }));
vi.mock("../use-goals", () => ({ useGoals: () => hookValue }));
vi.mock("@/features/plans", async (importOriginal) => ({
  ...(await importOriginal<typeof PlansModule>()),
  usePlanOptions: () => ({ options: [], loading: false }),
}));

import { GoalsView } from "./GoalsView";

const goal: Goal = {
  id: "g1",
  title: "Run a half marathon",
  description: "Train for six months.",
  pillarIds: ["personal"],
  parentPlanId: null,
  startDate: "2026-01-01",
  targetDate: "2026-06-30",
  goalStatus: "in-progress",
  priority: "high",
  progress: 35,
  measurementType: "duration",
  targetValue: 21,
  currentValue: 8,
  unit: "km",
  reviewFrequency: "weekly",
  notes: "",
  status: "active",
  version: 1,
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

beforeEach(() => {
  [reload, create, update, archive].forEach((fn) => fn.mockReset());
  hookValue = { status: "ready", items: [], error: null, reload, create, update, archive };
});

describe("GoalsView", () => {
  it("shows the empty state", () => {
    render(<GoalsView />);
    expect(screen.getByText("No goals yet")).toBeInTheDocument();
  });

  it("renders a goal card with status, priority, progress, and measure", () => {
    hookValue.items = [goal];
    render(<GoalsView />);
    expect(screen.getByRole("heading", { name: "Run a half marathon" })).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("8 / 21 km")).toBeInTheDocument();
  });

  it("opens the new-goal dialog", async () => {
    render(<GoalsView />);
    await userEvent.click(screen.getByRole("button", { name: /new goal/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { status: "error", items: [], error: "boom", reload, create, update, archive };
    render(<GoalsView />);
    expect(screen.getByText("We couldn't load your goals")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

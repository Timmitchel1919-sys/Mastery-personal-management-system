import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Plan } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/five-year" }));
vi.mock("../use-plans", () => ({ usePlans: () => hookValue }));

import { PlansView } from "./PlansView";

const plan: Plan = {
  id: "p1",
  horizon: "five-year",
  title: "Financial independence",
  objective: "Build a resilient base.",
  desiredOutcomes: ["Six months of expenses saved"],
  keyMeasures: ["Savings rate"],
  startDate: "2026-01-01",
  endDate: "2030-12-31",
  planStatus: "active",
  progress: 40,
  reviewNotes: "",
  pillarIds: ["personal", "societal"],
  parentId: null,
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

describe("PlansView", () => {
  it("shows the empty state", () => {
    render(<PlansView horizon="five-year" />);
    expect(screen.getByText(/no five-year plans yet/i)).toBeInTheDocument();
  });

  it("is parameterized by planning horizon", () => {
    render(<PlansView horizon="week" />);
    expect(screen.getByRole("heading", { name: "Weekly Plans" })).toBeInTheDocument();
    expect(screen.getByText(/no weekly plans yet/i)).toBeInTheDocument();
  });

  it("renders a plan card with progress and status", () => {
    hookValue.items = [plan];
    render(<PlansView horizon="five-year" />);
    expect(screen.getByRole("heading", { name: "Financial independence" })).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /financial independence progress/i }),
    ).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("opens the new-plan dialog", async () => {
    render(<PlansView horizon="five-year" />);
    await userEvent.click(screen.getByRole("button", { name: /new plan/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { status: "error", items: [], error: "boom", reload, create, update, archive };
    render(<PlansView horizon="five-year" />);
    expect(screen.getByText(/couldn't load your five-year plans/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type { MatrixItem } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const move = vi.fn();
const toggleComplete = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/priority-matrix" }));
vi.mock("../use-priority-matrix", () => ({ usePriorityMatrix: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [], loading: false }),
}));
vi.mock("@/features/projects", async (importOriginal) => ({
  ...(await importOriginal<typeof ProjectsModule>()),
  useProjectOptions: () => ({
    options: [{ id: "project-1", title: "Portfolio site" }],
    loading: false,
  }),
}));

import { PriorityMatrixView } from "./PriorityMatrixView";

const emptyByQuadrant = { do: [], schedule: [], delegate: [], eliminate: [] };
const emptyStats = {
  total: 0,
  completed: 0,
  open: 0,
  openByQuadrant: { do: 0, schedule: 0, delegate: 0, eliminate: 0 },
};

const item: MatrixItem = {
  id: "m1",
  status: "active",
  version: 1,
  createdAt: "2026-09-02T10:00:00.000Z",
  updatedAt: "2026-09-02T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Reply to the auditor",
  quadrant: "do",
  note: "",
  goalId: null,
  projectId: "project-1",
  pillarIds: ["societal"],
  completed: false,
};

beforeEach(() => {
  [reload, create, update, archive, move, toggleComplete].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    byQuadrant: emptyByQuadrant,
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    move,
    toggleComplete,
  };
});

describe("PriorityMatrixView", () => {
  it("renders the four quadrants, each empty", () => {
    render(<PriorityMatrixView />);
    expect(screen.getByRole("heading", { name: "Do" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Schedule" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Delegate" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Eliminate" })).toBeInTheDocument();
    expect(screen.getAllByText("Nothing here yet.")).toHaveLength(4);
  });

  it("places an item in its quadrant with a move control and toggles completion", async () => {
    hookValue.items = [item];
    hookValue.byQuadrant = { ...emptyByQuadrant, do: [item] };
    hookValue.stats = {
      ...emptyStats,
      total: 1,
      open: 1,
      openByQuadrant: { ...emptyStats.openByQuadrant, do: 1 },
    };
    render(<PriorityMatrixView />);

    expect(screen.getByText("Reply to the auditor")).toBeInTheDocument();
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /move to quadrant/i })).toBeInTheDocument();
    expect(screen.getAllByText("Nothing here yet.")).toHaveLength(3);

    await userEvent.click(screen.getByRole("checkbox", { name: /mark as done/i }));
    expect(toggleComplete).toHaveBeenCalledWith("m1", true);
  });

  it("opens the new-item dialog", async () => {
    render(<PriorityMatrixView />);
    await userEvent.click(screen.getByRole("button", { name: /new item/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = {
      status: "error",
      items: [],
      byQuadrant: emptyByQuadrant,
      stats: emptyStats,
      error: "boom",
      reload,
      create,
      update,
      archive,
      move,
      toggleComplete,
    };
    render(<PriorityMatrixView />);
    expect(screen.getByText("We couldn't load your priority matrix")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

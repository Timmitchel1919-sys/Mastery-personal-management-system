import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type * as MilestonesModule from "@/features/milestones";
import type { Task } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const setStatusFor = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/act/tasks" }));
vi.mock("@/hooks/use-mounted", () => ({ useMounted: () => true }));
vi.mock("../use-tasks", () => ({ useTasks: () => hookValue }));
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
vi.mock("@/features/milestones", async (importOriginal) => ({
  ...(await importOriginal<typeof MilestonesModule>()),
  useMilestoneOptions: () => ({ options: [], loading: false }),
}));

import { TasksView } from "./TasksView";

const emptyStats = {
  total: 0,
  open: 0,
  done: 0,
  blocked: 0,
  overdue: 0,
  dueToday: 0,
  loggedMinutes: 0,
};

const task: Task = {
  id: "t1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Draft the report",
  description: "",
  taskStatus: "todo",
  priority: "high",
  startDate: null,
  dueDate: "2000-01-01",
  pillarIds: [],
  goalId: null,
  projectId: "project-1",
  milestoneId: null,
  parentTaskId: null,
  recurrence: null,
  estimatedMinutes: 0,
  actualMinutes: 0,
  energyRequirement: "medium",
  context: "",
  tags: ["writing"],
  notes: "",
  completedAt: null,
  resolutionReason: "",
};

beforeEach(() => {
  [reload, create, update, archive, setStatusFor].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    stats: emptyStats,
    subtaskProgress: new Map(),
    error: null,
    reload,
    create,
    update,
    archive,
    setStatusFor,
  };
});

describe("TasksView", () => {
  it("shows the empty state", () => {
    render(<TasksView />);
    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
  });

  it("renders a task card with status, priority, overdue, link and subtasks", () => {
    hookValue.items = [task];
    hookValue.subtaskProgress = new Map([["t1", { total: 2, done: 1 }]]);
    hookValue.stats = { ...emptyStats, total: 1, open: 1, overdue: 1 };
    render(<TasksView />);
    expect(screen.getByRole("heading", { name: "Draft the report" })).toBeInTheDocument();
    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/overdue/)).toBeInTheDocument();
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
    expect(screen.getByText("1/2 subtasks")).toBeInTheDocument();
  });

  it("toggles a task to done", async () => {
    hookValue.items = [task];
    render(<TasksView />);
    await userEvent.click(screen.getByRole("checkbox", { name: /mark as done/i }));
    expect(setStatusFor).toHaveBeenCalledWith(task, "done");
  });

  it("opens the new-task dialog", async () => {
    render(<TasksView />);
    await userEvent.click(screen.getByRole("button", { name: /new task/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<TasksView />);
    expect(screen.getByText("We couldn't load your tasks")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

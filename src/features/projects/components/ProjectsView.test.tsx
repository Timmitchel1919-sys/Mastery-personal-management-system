import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { Project } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/projects" }));
vi.mock("../use-projects", () => ({ useProjects: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [], loading: false }),
}));

import { ProjectsView } from "./ProjectsView";

const project: Project = {
  id: "p1",
  title: "Launch personal site",
  description: "Design, build, and ship it.",
  expectedOutcome: "A live site at my domain.",
  pillarIds: ["personal"],
  goalId: null,
  owner: "Me",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  projectStatus: "active",
  priority: "high",
  progress: 40,
  dependencies: [],
  risks: ["Scope creep"],
  reviewNotes: "",
  status: "active",
  version: 1,
  createdAt: "2026-08-30T00:00:00.000Z",
  updatedAt: "2026-08-30T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

beforeEach(() => {
  [reload, create, update, archive].forEach((fn) => fn.mockReset());
  hookValue = { status: "ready", items: [], error: null, reload, create, update, archive };
});

describe("ProjectsView", () => {
  it("shows the empty state", () => {
    render(<ProjectsView />);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });

  it("renders a project card with status, priority, progress, and risk count", () => {
    hookValue.items = [project];
    render(<ProjectsView />);
    expect(screen.getByRole("heading", { name: "Launch personal site" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("1 risk")).toBeInTheDocument();
  });

  it("opens the new-project dialog", async () => {
    render(<ProjectsView />);
    await userEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { status: "error", items: [], error: "boom", reload, create, update, archive };
    render(<ProjectsView />);
    expect(screen.getByText("We couldn't load your projects")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

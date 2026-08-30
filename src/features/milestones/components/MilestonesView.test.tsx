import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type { Milestone } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/milestones" }));
vi.mock("../use-milestones", () => ({ useMilestones: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Get fit" }], loading: false }),
}));
vi.mock("@/features/projects", async (importOriginal) => ({
  ...(await importOriginal<typeof ProjectsModule>()),
  useProjectOptions: () => ({ options: [], loading: false }),
}));

import { MilestonesView } from "./MilestonesView";

const milestone: Milestone = {
  id: "m1",
  title: "First 5k without stopping",
  description: "Baseline fitness checkpoint.",
  pillarIds: ["personal"],
  parentType: "goal",
  parentId: "goal-1",
  dueDate: "2026-02-15",
  milestoneStatus: "in-progress",
  progress: 40,
  dependencies: ["New running shoes"],
  evidence: "",
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

describe("MilestonesView", () => {
  it("shows the empty state", () => {
    render(<MilestonesView />);
    expect(screen.getByText("No milestones yet")).toBeInTheDocument();
  });

  it("renders a milestone card with status, progress, parent, and dependency count", () => {
    hookValue.items = [milestone];
    render(<MilestonesView />);
    expect(screen.getByRole("heading", { name: "First 5k without stopping" })).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Goal: Get fit")).toBeInTheDocument();
    expect(screen.getByText("1 dependency")).toBeInTheDocument();
  });

  it("opens the new-milestone dialog", async () => {
    render(<MilestonesView />);
    await userEvent.click(screen.getByRole("button", { name: /new milestone/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { status: "error", items: [], error: "boom", reload, create, update, archive };
    render(<MilestonesView />);
    expect(screen.getByText("We couldn't load your milestones")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

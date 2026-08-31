import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type { Roadmap } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/roadmaps" }));
vi.mock("../use-roadmaps", () => ({ useRoadmaps: () => hookValue }));
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

import { RoadmapsView } from "./RoadmapsView";

const roadmap: Roadmap = {
  id: "r1",
  title: "Become fluent in Spanish",
  description: "A year-long learning roadmap.",
  pillarIds: ["personal"],
  roadmapKind: "learning",
  linkedGoalId: null,
  linkedProjectId: "project-1",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  roadmapStatus: "active",
  progress: 15,
  phases: [
    { name: "Foundations", startDate: "2026-01-01", endDate: "2026-03-31", phaseStatus: "done" },
    { name: "Conversation", startDate: "2026-04-01", endDate: null, phaseStatus: "in-progress" },
  ],
  notes: "",
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

describe("RoadmapsView", () => {
  it("shows the empty state", () => {
    render(<RoadmapsView />);
    expect(screen.getByText("No roadmaps yet")).toBeInTheDocument();
  });

  it("renders a roadmap card with status, kind, progress, phases, and link", () => {
    hookValue.items = [roadmap];
    render(<RoadmapsView />);
    expect(screen.getByRole("heading", { name: "Become fluent in Spanish" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Learning plan")).toBeInTheDocument();
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("Foundations")).toBeInTheDocument();
    expect(screen.getByText("1/2 phases done")).toBeInTheDocument();
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
  });

  it("opens the new-roadmap dialog", async () => {
    render(<RoadmapsView />);
    await userEvent.click(screen.getByRole("button", { name: /new roadmap/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { status: "error", items: [], error: "boom", reload, create, update, archive };
    render(<RoadmapsView />);
    expect(screen.getByText("We couldn't load your roadmaps")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

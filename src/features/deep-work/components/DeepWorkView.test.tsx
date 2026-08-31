import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type { DeepWorkSession } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/deep-work" }));
vi.mock("../use-deep-work", () => ({ useDeepWork: () => hookValue }));
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

import { DeepWorkView } from "./DeepWorkView";

const emptyStats = {
  sessions: 0,
  completed: 0,
  focusMinutes: 0,
  distractions: 0,
  avgScore: null,
  avgFocusQuality: null,
  last7DaysMinutes: 0,
};

const session: DeepWorkSession = {
  id: "d1",
  status: "active",
  version: 1,
  createdAt: "2026-08-31T10:30:00.000Z",
  updatedAt: "2026-08-31T10:30:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Draft the spec",
  intendedOutcome: "A complete first draft.",
  goalId: null,
  projectId: "project-1",
  plannedMinutes: 90,
  startedAt: "2026-08-31T09:00",
  endedAt: "2026-08-31T10:30",
  actualMinutes: 85,
  energyLevel: 4,
  focusQuality: 4,
  distractions: ["Slack ping"],
  completionNotes: "Solid block.",
  sessionStatus: "completed",
};

beforeEach(() => {
  [reload, create, update, archive].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
  };
});

describe("DeepWorkView", () => {
  it("shows the empty state", () => {
    render(<DeepWorkView />);
    expect(screen.getByText("No deep work sessions yet")).toBeInTheDocument();
  });

  it("renders a session card with status, score, ratings, and project link", () => {
    hookValue.items = [session];
    hookValue.stats = { ...emptyStats, sessions: 1, completed: 1, focusMinutes: 85 };
    render(<DeepWorkView />);
    expect(screen.getByRole("heading", { name: "Draft the spec" })).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText(/^Score \d+$/)).toBeInTheDocument();
    expect(screen.getByText("85/90 min")).toBeInTheDocument();
    expect(screen.getByText("1 distraction")).toBeInTheDocument();
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
  });

  it("opens the new-session dialog", async () => {
    render(<DeepWorkView />);
    await userEvent.click(screen.getByRole("button", { name: /new session/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = {
      status: "error",
      items: [],
      stats: emptyStats,
      error: "boom",
      reload,
      create,
      update,
      archive,
    };
    render(<DeepWorkView />);
    expect(screen.getByText("We couldn't load your deep work log")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

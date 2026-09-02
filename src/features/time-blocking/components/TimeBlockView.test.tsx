import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import type { TimeBlock } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/time-blocking" }));
vi.mock("../use-time-blocking", () => ({ useTimeBlocking: () => hookValue }));
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

import { TimeBlockView } from "./TimeBlockView";

const emptyStats = {
  blocks: 0,
  planned: 0,
  done: 0,
  skipped: 0,
  scheduledMinutes: 0,
  completedMinutes: 0,
  conflictedBlocks: 0,
};

const block: TimeBlock = {
  id: "tb1",
  status: "active",
  version: 1,
  createdAt: "2026-09-02T07:00:00.000Z",
  updatedAt: "2026-09-02T07:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Morning deep work",
  category: "deep-work",
  timeZone: "Europe/Amsterdam",
  startDateTime: "2026-09-02T09:00:00+02:00",
  endDateTime: "2026-09-02T10:30:00+02:00",
  pillarIds: ["personal"],
  goalId: null,
  projectId: "project-1",
  notes: "",
  blockStatus: "planned",
};

beforeEach(() => {
  [reload, create, update, archive].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    conflicts: new Map<string, string[]>(),
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
  };
});

describe("TimeBlockView", () => {
  it("shows the empty state", () => {
    render(<TimeBlockView />);
    expect(screen.getByText("No time blocks yet")).toBeInTheDocument();
  });

  it("renders a block card with category, status, duration, and project link", () => {
    hookValue.items = [block];
    hookValue.stats = { ...emptyStats, blocks: 1, planned: 1 };
    render(<TimeBlockView />);
    expect(screen.getByRole("heading", { name: "Morning deep work" })).toBeInTheDocument();
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
  });

  it("warns when blocks conflict and marks the overlapping card", () => {
    hookValue.items = [block, { ...block, id: "tb2", title: "Standup" }];
    hookValue.conflicts = new Map<string, string[]>([
      ["tb1", ["tb2"]],
      ["tb2", ["tb1"]],
    ]);
    hookValue.stats = { ...emptyStats, blocks: 2, planned: 2, conflictedBlocks: 2 };
    render(<TimeBlockView />);
    expect(screen.getByText("Scheduling conflict")).toBeInTheDocument();
    expect(screen.getAllByText("Overlap")).toHaveLength(2);
  });

  it("opens the new-block dialog", async () => {
    render(<TimeBlockView />);
    await userEvent.click(screen.getByRole("button", { name: /new block/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = {
      status: "error",
      items: [],
      conflicts: new Map(),
      stats: emptyStats,
      error: "boom",
      reload,
      create,
      update,
      archive,
    };
    render(<TimeBlockView />);
    expect(screen.getByText("We couldn't load your time blocks")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

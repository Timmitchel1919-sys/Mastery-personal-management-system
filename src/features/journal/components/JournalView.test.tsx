import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { JournalEntry } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const setFilter = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/grow/journal" }));
vi.mock("../use-journal", () => ({ useJournal: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Grow in faith" }], loading: false }),
}));

import { JournalView } from "./JournalView";

const emptyStats = { total: 0, last7Days: 0, avgMood: null, avgEnergy: null, distinctTags: 0 };
const emptyFilter = { query: "", entryType: "all" as const };

const entry: JournalEntry = {
  id: "j1",
  status: "active",
  version: 1,
  createdAt: "2026-09-02T10:00:00.000Z",
  updatedAt: "2026-09-02T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "A good day",
  entryType: "free-form",
  entryDate: "2026-09-02",
  content: "Today was productive.",
  gratitudeItems: [],
  moodRating: 4,
  energyLevel: 3,
  pillarIds: ["personal"],
  goalId: "goal-1",
  tags: ["work"],
  isPrivate: false,
};

beforeEach(() => {
  [reload, create, update, archive, setFilter].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    filteredItems: [],
    filter: emptyFilter,
    setFilter,
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
  };
});

describe("JournalView", () => {
  it("shows the empty state when there are no entries at all", () => {
    render(<JournalView />);
    expect(screen.getByText("No journal entries yet")).toBeInTheDocument();
  });

  it("renders an entry card with type, mood/energy, link, and tags", () => {
    hookValue.items = [entry];
    hookValue.filteredItems = [entry];
    hookValue.stats = { ...emptyStats, total: 1 };
    render(<JournalView />);
    expect(screen.getByRole("heading", { name: "A good day" })).toBeInTheDocument();
    expect(screen.getByText("Free-form")).toBeInTheDocument();
    expect(screen.getByText("mood 4/5")).toBeInTheDocument();
    expect(screen.getByText("Grow in faith")).toBeInTheDocument();
    expect(screen.getByText("work")).toBeInTheDocument();
  });

  it("shows a 'no entries match' message when the filter excludes everything", () => {
    hookValue.items = [entry];
    hookValue.filteredItems = [];
    hookValue.stats = { ...emptyStats, total: 1 };
    render(<JournalView />);
    expect(screen.getByText("No entries match")).toBeInTheDocument();
  });

  it("updates the search filter as the user types", async () => {
    hookValue.items = [entry];
    hookValue.filteredItems = [entry];
    render(<JournalView />);
    await userEvent.type(screen.getByLabelText("Search journal entries"), "x");
    expect(setFilter).toHaveBeenCalledWith({ ...emptyFilter, query: "x" });
  });

  it("opens the new-entry dialog", async () => {
    render(<JournalView />);
    await userEvent.click(screen.getByRole("button", { name: /new entry/i }));
    expect(await screen.findByLabelText("Entry")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<JournalView />);
    expect(screen.getByText("We couldn't load your journal")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

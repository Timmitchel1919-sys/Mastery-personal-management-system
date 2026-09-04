import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { Book } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const toggleActionItem = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/grow/reading" }));
vi.mock("../use-reading", () => ({ useReading: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Grow in faith" }], loading: false }),
}));

import { ReadingView } from "./ReadingView";

const emptyStats = {
  total: 0,
  currentlyReading: 0,
  wantToRead: 0,
  completed: 0,
  completedLast30Days: 0,
};

const book: Book = {
  id: "b1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Deep Work",
  author: "Cal Newport",
  readingStatus: "currently-reading",
  currentPage: 50,
  totalPages: 200,
  startedDate: "2026-09-01",
  completedDate: null,
  highlights: [{ id: "h1", quote: "Focus is a skill.", pageNumber: 12 }],
  lessons: ["Protect deep work blocks"],
  actionItems: [{ id: "a1", title: "Block 2h tomorrow", completed: false }],
  notes: "",
  pillarIds: [],
  goalId: "goal-1",
};

beforeEach(() => {
  [reload, create, update, archive, toggleActionItem].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    toggleActionItem,
  };
});

describe("ReadingView", () => {
  it("shows the empty state", () => {
    render(<ReadingView />);
    expect(screen.getByText("No books yet")).toBeInTheDocument();
  });

  it("groups a book under its status section and renders its details", async () => {
    hookValue.items = [book];
    hookValue.stats = { ...emptyStats, total: 1, currentlyReading: 1 };
    render(<ReadingView />);

    expect(screen.getByRole("heading", { name: "Currently reading" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deep Work" })).toBeInTheDocument();
    expect(screen.getByText("Cal Newport")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText(/Focus is a skill/)).toBeInTheDocument();
    expect(screen.getByText("Protect deep work blocks")).toBeInTheDocument();
    expect(screen.getByText("Grow in faith")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: /block 2h tomorrow/i }));
    expect(toggleActionItem).toHaveBeenCalledWith(book, "a1");
  });

  it("opens the new-book dialog", async () => {
    render(<ReadingView />);
    await userEvent.click(screen.getByRole("button", { name: /new book/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<ReadingView />);
    expect(screen.getByText("We couldn't load your reading list")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { LearningItem, StudySession } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const toggleLesson = vi.fn();
const logSession = vi.fn();
const removeSession = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/grow/learning" }));
vi.mock("../use-learning", () => ({ useLearning: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Grow in faith" }], loading: false }),
}));

import { LearningView } from "./LearningView";

const emptyStats = {
  totalItems: 0,
  inProgress: 0,
  completed: 0,
  totalStudyMinutes: 0,
  studyMinutesLast7Days: 0,
};

const item: LearningItem = {
  id: "li1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Advanced TypeScript",
  description: "",
  itemType: "course",
  learningStatus: "in-progress",
  provider: "Frontend Masters",
  targetCompletionDate: null,
  resources: [],
  lessons: [{ id: "l1", title: "Generics", completed: false }],
  assessmentNotes: "",
  notes: "",
  pillarIds: [],
  goalId: "goal-1",
  skillId: null,
};

const session: StudySession = {
  id: "s1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  learningItemId: "li1",
  date: "2026-09-01",
  minutes: 30,
  notes: "",
};

beforeEach(() => {
  [reload, create, update, archive, toggleLesson, logSession, removeSession].forEach((fn) =>
    fn.mockReset(),
  );
  hookValue = {
    status: "ready",
    items: [],
    sessions: [],
    studyMinutesByItem: new Map(),
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    toggleLesson,
    logSession,
    removeSession,
  };
});

describe("LearningView", () => {
  it("shows the empty state", () => {
    render(<LearningView />);
    expect(screen.getByText("No learning items yet")).toBeInTheDocument();
  });

  it("renders an item card with type, status, lessons, and goal link", async () => {
    hookValue.items = [item];
    hookValue.studyMinutesByItem = new Map([["li1", 30]]);
    hookValue.stats = { ...emptyStats, totalItems: 1, inProgress: 1 };
    render(<LearningView />);

    expect(screen.getByRole("heading", { name: "Advanced TypeScript" })).toBeInTheDocument();
    expect(screen.getByText("Course")).toBeInTheDocument();
    expect(screen.getByText("Generics")).toBeInTheDocument();
    expect(screen.getByText("Grow in faith")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: /generics/i }));
    expect(toggleLesson).toHaveBeenCalledWith(item, "l1");
  });

  it("shows recent study sessions and can remove one", async () => {
    hookValue.items = [item];
    hookValue.sessions = [session];
    render(<LearningView />);
    expect(screen.getByText("Recent study sessions")).toBeInTheDocument();
    expect(screen.getByText(/30 min/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /remove session/i }));
    expect(removeSession).toHaveBeenCalledWith("s1");
  });

  it("opens the log-session dialog", async () => {
    render(<LearningView />);
    await userEvent.click(screen.getByRole("button", { name: /log session/i }));
    expect(await screen.findByLabelText("Learning item")).toBeInTheDocument();
  });

  it("opens the new-item dialog", async () => {
    render(<LearningView />);
    await userEvent.click(screen.getByRole("button", { name: /new item/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<LearningView />);
    expect(screen.getByText("We couldn't load your learning items")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

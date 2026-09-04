import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { Skill, SkillReview } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const logReview = vi.fn();
const removeReview = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/grow/skills" }));
vi.mock("../use-skills", () => ({ useSkills: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Grow in faith" }], loading: false }),
}));

import { SkillsView } from "./SkillsView";

const emptyStats = { total: 0, dueForReview: 0, avgProgressToTarget: null };

const skill: Skill = {
  id: "sk1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Public speaking",
  description: "",
  category: "interpersonal",
  startingProficiency: 2,
  targetProficiency: 4,
  practicePlan: "Present at the team meeting weekly",
  evidence: ["Gave a talk at work"],
  resources: ["https://example.com/course"],
  goalId: "goal-1",
  pillarIds: [],
  nextReviewDate: "2020-01-01",
};

const review: SkillReview = {
  id: "r1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  skillId: "sk1",
  date: "2026-09-04",
  proficiency: 3,
  notes: "Felt more confident",
};

beforeEach(() => {
  [reload, create, update, archive, logReview, removeReview].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    reviewsBySkill: new Map(),
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    logReview,
    removeReview,
  };
});

describe("SkillsView", () => {
  it("shows the empty state", () => {
    render(<SkillsView />);
    expect(screen.getByText("No skills yet")).toBeInTheDocument();
  });

  it("renders a skill card with category, proficiency, practice plan, and goal link", () => {
    hookValue.items = [skill];
    hookValue.reviewsBySkill = new Map([["sk1", [review]]]);
    hookValue.stats = { total: 1, dueForReview: 1, avgProgressToTarget: 25 };
    render(<SkillsView />);

    expect(screen.getByRole("heading", { name: "Public speaking" })).toBeInTheDocument();
    expect(screen.getByText("Interpersonal")).toBeInTheDocument();
    expect(screen.getByText("3 → 4")).toBeInTheDocument();
    expect(screen.getByText("Review due")).toBeInTheDocument();
    expect(screen.getByText("Present at the team meeting weekly")).toBeInTheDocument();
    expect(screen.getByText("Gave a talk at work")).toBeInTheDocument();
    expect(screen.getByText("Grow in faith")).toBeInTheDocument();
    expect(screen.getByText(/Felt more confident/)).toBeInTheDocument();
  });

  it("opens the log-review dialog for a skill", async () => {
    hookValue.items = [skill];
    hookValue.reviewsBySkill = new Map();
    render(<SkillsView />);

    await userEvent.click(screen.getByRole("button", { name: /log review/i }));
    expect(
      await screen.findByRole("heading", { name: /log a review — Public speaking/i }),
    ).toBeInTheDocument();
  });

  it("opens the new-skill dialog", async () => {
    render(<SkillsView />);
    await userEvent.click(screen.getByRole("button", { name: /new skill/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<SkillsView />);
    expect(screen.getByText("We couldn't load your skills")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

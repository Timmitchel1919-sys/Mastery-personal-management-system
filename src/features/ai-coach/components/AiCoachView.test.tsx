import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { CoachExchange } from "../schema";

const reload = vi.fn();
const ask = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/grow/ai-coach" }));
vi.mock("../use-ai-coach", () => ({ useAiCoach: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Ship v1" }], loading: false }),
}));
vi.mock("@/features/weekly-summaries", () => ({
  WeeklySummariesView: () => <div>Weekly summaries stub</div>,
}));

import { AiCoachView } from "./AiCoachView";

const exchange: CoachExchange = {
  id: "e1",
  status: "active",
  version: 1,
  createdAt: "2026-09-04T10:00:00.000Z",
  updatedAt: "2026-09-04T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  intent: "coach-query",
  targetRef: null,
  userMessage: "What should I focus on?",
  answer: "Focus on Ship v1 this week.",
  assumptions: ["You have a few hours available"],
  suggestedActions: [{ id: "a1", label: "Block 2h", description: "Schedule deep work" }],
  disclaimers: [],
  influencedBy: [{ collection: "goals", id: "goal-1", label: "Ship v1" }],
};

beforeEach(() => {
  [reload, ask].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    exchanges: [],
    error: null,
    reload,
    ask,
    asking: false,
    askError: null,
  };
});

describe("AiCoachView", () => {
  it("shows the empty state with no exchanges", () => {
    render(<AiCoachView />);
    expect(screen.getByText("No coach exchanges yet")).toBeInTheDocument();
  });

  it("disables Ask until a message is typed for a coach query", async () => {
    render(<AiCoachView />);
    const button = screen.getByRole("button", { name: /ask/i });
    expect(button).toBeDisabled();

    await userEvent.type(
      screen.getByPlaceholderText("What's on your mind?"),
      "Help me plan my week",
    );
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(ask).toHaveBeenCalledWith("coach-query", {
      userMessage: "Help me plan my week",
      targetRef: null,
    });
  });

  it("renders exchange history with answer, assumptions, actions, and influencedBy", () => {
    hookValue.exchanges = [exchange];
    render(<AiCoachView />);

    expect(screen.getByText("Focus on Ship v1 this week.")).toBeInTheDocument();
    expect(screen.getByText("You have a few hours available")).toBeInTheDocument();
    expect(screen.getByText(/Block 2h/)).toBeInTheDocument();
    expect(screen.getByText("Ship v1")).toBeInTheDocument();
  });

  it("shows the Weekly Summaries tab when selected", async () => {
    render(<AiCoachView />);
    expect(screen.queryByText("Weekly summaries stub")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Weekly Summaries" }));
    expect(screen.getByText("Weekly summaries stub")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<AiCoachView />);
    expect(screen.getByText("We couldn't load your coach history")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

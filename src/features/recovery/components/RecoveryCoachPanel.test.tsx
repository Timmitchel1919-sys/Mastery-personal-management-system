import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryCoachSession } from "../recovery-coach-schema";

const ask = vi.fn();
const reload = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("../use-recovery-coach", () => ({ useRecoveryCoach: () => hookValue }));

import { RecoveryCoachPanel } from "./RecoveryCoachPanel";

const session: RecoveryCoachSession = {
  id: "sess1",
  status: "active",
  version: 1,
  createdAt: "2026-09-05T20:00:00.000Z",
  updatedAt: "2026-09-05T20:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  goalId: "g1",
  message: "the urge is strong tonight",
  reply: "That is real, and it will pass. Try a ten-minute delay.",
  suggestedSteps: [{ id: "s1", label: "Ten-minute delay", description: "Set a timer." }],
  disclaimers: ["This isn't a substitute for professional help."],
  influencedBy: [],
};

beforeEach(() => {
  [ask, reload].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    sessions: [],
    error: null,
    reload,
    ask,
    asking: false,
    askError: null,
  };
});

describe("RecoveryCoachPanel", () => {
  it("shows the isolation note and empty state", () => {
    render(<RecoveryCoachPanel goalId="g1" />);
    expect(screen.getByRole("heading", { name: "Recovery Coach" })).toBeInTheDocument();
    expect(
      screen.getByText(/only sees this goal.*never your general planning data/i),
    ).toBeInTheDocument();
    expect(screen.getByText("No coach conversations yet for this goal.")).toBeInTheDocument();
  });

  it("sends the message to ask() and clears the field on success", async () => {
    ask.mockResolvedValue({ reply: "ok", suggestedSteps: [], disclaimers: [], influencedBy: [] });
    render(<RecoveryCoachPanel goalId="g1" />);
    const box = screen.getByLabelText(/what's going on right now/i);
    await userEvent.type(box, "I keep reaching for my phone");
    await userEvent.click(screen.getByRole("button", { name: /ask for a next step/i }));
    expect(ask).toHaveBeenCalledWith("I keep reaching for my phone");
  });

  it("renders a past session with its steps and disclaimers", () => {
    hookValue.sessions = [session];
    render(<RecoveryCoachPanel goalId="g1" />);
    expect(screen.getByText(/That is real, and it will pass/)).toBeInTheDocument();
    expect(screen.getByText("Ten-minute delay")).toBeInTheDocument();
    expect(screen.getByText(/isn't a substitute for professional help/)).toBeInTheDocument();
  });

  it("shows the ask error", () => {
    hookValue.askError = "You've reached today's AI request limit.";
    render(<RecoveryCoachPanel goalId="g1" />);
    expect(screen.getByText("You've reached today's AI request limit.")).toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
    hookValue.status = "error";
    hookValue.error = "nope";
    render(<RecoveryCoachPanel goalId="g1" />);
    expect(screen.getByText("We couldn't load your coach history")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

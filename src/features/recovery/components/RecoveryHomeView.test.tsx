import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryGoal } from "../recovery-goal-schema";

const lock = vi.fn();
const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let goalsValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/recovery" }));
vi.mock("../use-recovery-lock", () => ({ useRecoveryLock: () => ({ lock }) }));
vi.mock("../use-recovery-goals", () => ({ useRecoveryGoals: () => goalsValue }));
vi.mock("./RecoveryGoalDetailView", () => ({
  RecoveryGoalDetailView: ({ goal }: { goal: { behavior: string } }) => (
    <div>Detail for {goal.behavior}</div>
  ),
}));

import { RecoveryHomeView } from "./RecoveryHomeView";

const goal: RecoveryGoal = {
  id: "rg1",
  status: "active",
  version: 1,
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  behavior: "Late-night doomscrolling",
  description: "",
  motivation: "I want mornings back",
  startDate: "2026-09-01",
  triggers: ["Boredom after dinner"],
  warningSigns: ["Phone within reach in bed"],
  copingStrategies: ["Charge phone in the kitchen"],
  supportNotes: "",
  faithBasedEncouragement: false,
  recoveryStatus: "challenging",
};

beforeEach(() => {
  [lock, reload, create, update, archive].forEach((fn) => fn.mockReset());
  goalsValue = { status: "ready", items: [], error: null, reload, create, update, archive };
});

describe("RecoveryHomeView", () => {
  it("shows the privacy assurances, the disclaimer, and remaining upcoming sublayers", () => {
    render(<RecoveryHomeView />);
    expect(
      screen.getByText("Kept out of your dashboard, global search, and ordinary notifications."),
    ).toBeInTheDocument();
    expect(screen.getByText(/not medical or psychological advice/)).toBeInTheDocument();
    expect(screen.getByText("Accountability partner")).toBeInTheDocument();
  });

  it("locks the module when Lock is clicked", async () => {
    render(<RecoveryHomeView />);
    await userEvent.click(screen.getByRole("button", { name: /^lock$/i }));
    expect(lock).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state and opens the new-goal dialog", async () => {
    render(<RecoveryHomeView />);
    expect(screen.getByText("No recovery goals yet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /new recovery goal/i }));
    expect(await screen.findByLabelText("What are you working on?")).toBeInTheDocument();
  });

  it("renders a recovery goal card with its status, motivation, and lists", () => {
    goalsValue.items = [goal];
    render(<RecoveryHomeView />);
    expect(screen.getByRole("heading", { name: "Late-night doomscrolling" })).toBeInTheDocument();
    expect(screen.getByText("Challenging right now")).toBeInTheDocument();
    expect(screen.getByText("I want mornings back")).toBeInTheDocument();
    expect(screen.getByText("Charge phone in the kitchen")).toBeInTheDocument();
  });

  it("archives a goal after confirming", async () => {
    goalsValue.items = [goal];
    render(<RecoveryHomeView />);
    await userEvent.click(screen.getByRole("button", { name: /archive goal/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^archive$/i }));
    expect(archive).toHaveBeenCalledWith("rg1");
  });

  it("opens the goal detail view", async () => {
    goalsValue.items = [goal];
    render(<RecoveryHomeView />);
    await userEvent.click(screen.getByRole("button", { name: /^open$/i }));
    expect(screen.getByText("Detail for Late-night doomscrolling")).toBeInTheDocument();
    // The "New recovery goal" action is hidden while a goal is open.
    expect(screen.queryByRole("button", { name: /new recovery goal/i })).not.toBeInTheDocument();
  });

  it("renders an error state with retry", async () => {
    goalsValue = { ...goalsValue, status: "error", error: "boom" };
    render(<RecoveryHomeView />);
    expect(screen.getByText("We couldn't load your recovery goals")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryGoal } from "../recovery-goal-schema";
import type { RecoveryCheckIn } from "../recovery-checkin-schema";
import type { RecoveryProgress } from "../recovery-progress";

const submitCheckIn = vi.fn();
const checkInReload = vi.fn();
const logSetback = vi.fn();
let checkInsValue: Record<string, unknown>;
let relapsesValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/recovery" }));
vi.mock("../use-recovery-checkins", () => ({ useRecoveryCheckIns: () => checkInsValue }));
vi.mock("../use-recovery-relapses", () => ({ useRecoveryRelapses: () => relapsesValue }));
vi.mock("../use-recovery-coping", () => ({
  useRecoveryCoping: () => ({
    status: "ready",
    items: [],
    error: null,
    reload: vi.fn(),
    addCopingAction: vi.fn(),
    addSuggestion: vi.fn(),
    editCopingAction: vi.fn(),
    removeCopingAction: vi.fn(),
    saving: false,
  }),
}));
vi.mock("../use-recovery-coach", () => ({
  useRecoveryCoach: () => ({
    status: "ready",
    sessions: [],
    error: null,
    reload: vi.fn(),
    ask: vi.fn(),
    asking: false,
    askError: null,
  }),
}));

import { RecoveryGoalDetailView } from "./RecoveryGoalDetailView";

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
  motivation: "",
  startDate: null,
  triggers: [],
  warningSigns: [],
  copingStrategies: [],
  supportNotes: "",
  faithBasedEncouragement: false,
  recoveryStatus: "active",
};

const checkIn: RecoveryCheckIn = {
  id: "c1",
  status: "active",
  version: 1,
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  date: "2026-09-08",
  stayedOnTrack: false,
  urgeIntensity: 6,
  halt: { hungry: true, angry: false, lonely: false, tired: true },
  triggersToday: ["Boredom"],
  copingUsed: [],
  reflection: "Rough evening",
};

const progress: RecoveryProgress = {
  checkInCount: 4,
  currentStreak: 0,
  longestStreak: 3,
  daysOnTrack: 3,
  averageUrge: 4.5,
  lastCheckInDate: "2026-09-08",
};

beforeEach(() => {
  [submitCheckIn, checkInReload, logSetback].forEach((fn) => fn.mockReset());
  checkInsValue = {
    status: "ready",
    items: [],
    progress,
    error: null,
    reload: checkInReload,
    submitCheckIn,
    saving: false,
  };
  relapsesValue = {
    status: "ready",
    items: [],
    error: null,
    reload: vi.fn(),
    logSetback,
    logging: false,
    logError: null,
  };
});

describe("RecoveryGoalDetailView", () => {
  it("shows the goal, its progress stats, and empty history", () => {
    render(<RecoveryGoalDetailView goal={goal} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Late-night doomscrolling" })).toBeInTheDocument();
    expect(screen.getByText("Longest streak")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("No check-ins yet. Add your first above.")).toBeInTheDocument();
    expect(screen.getByText("None logged.")).toBeInTheDocument();
  });

  it("calls onBack from the All goals link", async () => {
    const onBack = vi.fn();
    render(<RecoveryGoalDetailView goal={goal} onBack={onBack} />);
    await userEvent.click(screen.getByRole("button", { name: /all goals/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders a check-in history entry with its HALT and reflection", () => {
    checkInsValue.items = [checkIn];
    render(<RecoveryGoalDetailView goal={goal} onBack={vi.fn()} />);
    expect(screen.getByText("Hard day")).toBeInTheDocument();
    expect(screen.getByText(/HALT: Hungry, Tired/)).toBeInTheDocument();
    expect(screen.getByText("Rough evening")).toBeInTheDocument();
  });

  it("opens the check-in dialog and submits", async () => {
    render(<RecoveryGoalDetailView goal={goal} onBack={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /check in/i }));
    expect(await screen.findByText("Did you stay on track today?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /save check-in/i }));
    expect(submitCheckIn).toHaveBeenCalledTimes(1);
  });

  it("opens the setback dialog and submits", async () => {
    logSetback.mockResolvedValue(true);
    render(<RecoveryGoalDetailView goal={goal} onBack={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /log a setback/i }));
    expect(await screen.findByText(/A setback is part of the process/)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("In your own words"), "Hard evening");
    await userEvent.click(screen.getByRole("button", { name: /save & restart/i }));
    expect(logSetback).toHaveBeenCalledWith(
      expect.objectContaining({ goalId: "rg1", whatHappened: "Hard evening" }),
    );
  });
});

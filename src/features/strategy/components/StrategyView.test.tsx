import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeWhatIf,
  buildStrategicReview,
  buildStrategy,
  type StrategyInput,
  type StrategyState,
  type WhatIfInput,
  type WhatIfResult,
} from "../strategy-engine";

const reload = vi.fn();
let value: {
  status: "loading" | "ready";
  state: StrategyState;
  review: (kind: "weekly" | "monthly" | "quarterly") => ReturnType<typeof buildStrategicReview>;
  whatIf: (q: WhatIfInput) => WhatIfResult;
  reload: () => void;
};

vi.mock("next/navigation", () => ({ usePathname: () => "/strategy" }));
vi.mock("../use-strategy", () => ({ useStrategy: () => value }));
vi.mock("@/features/context", () => ({
  RelevantContextPanel: () => <div data-testid="relevant-context" />,
}));

import { StrategyView } from "./StrategyView";

const NOW = "2026-09-10T09:00:00.000Z";
const iso = (daysAgo: number) => new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString();

function goalInput(): StrategyInput {
  return {
    nowIso: NOW,
    goals: [
      {
        id: "g1",
        status: "active",
        version: 1,
        createdAt: iso(90),
        updatedAt: iso(40),
        createdBy: "u",
        updatedBy: "u",
        archivedAt: null,
        title: "Certification",
        description: "",
        pillarIds: ["personal"],
        parentPlanId: null,
        startDate: null,
        targetDate: "2026-09-25",
        goalStatus: "in-progress",
        priority: "critical",
        progress: 5,
        measurementType: "percent",
        targetValue: null,
        currentValue: null,
        unit: "",
        reviewFrequency: "weekly",
      },
    ] as never,
    plans: [],
    intelligence: { status: "ready", attention: [], patterns: [], recommendations: [], today: [] },
    predictions: { status: "ready", enabled: true, signals: [] },
    decisions: [],
    brain: null,
  };
}

beforeEach(() => {
  reload.mockReset();
  const input = goalInput();
  const state = buildStrategy(input);
  value = {
    status: "ready",
    state,
    review: (kind) => buildStrategicReview(kind, input, state),
    whatIf: (q) => analyzeWhatIf(input, q),
    reload,
  };
});

describe("StrategyView", () => {
  it("renders the strategic context strip and recommendations", () => {
    render(<StrategyView />);
    expect(screen.getByRole("heading", { name: /strategic recommendations/i })).toBeInTheDocument();
    expect(screen.getByText(/Active goals/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /goal health/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^scenarios$/i })).toBeInTheDocument();
  });

  it("shows the advisory degradation banner when predictions are off", () => {
    const input = goalInput();
    input.predictions = { status: "ready", enabled: false, signals: [] };
    const state = buildStrategy(input);
    value = {
      ...value,
      state,
      review: (kind) => buildStrategicReview(kind, input, state),
    };
    render(<StrategyView />);
    expect(screen.getByText(/advisory only/i)).toBeInTheDocument();
    expect(screen.getByText(/Predictions are turned off/i)).toBeInTheDocument();
  });

  it("switches the strategic review cadence", async () => {
    render(<StrategyView />);
    expect(screen.getByRole("heading", { name: /strategic review/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /quarterly/i }));
    expect(await screen.findByText(/strategic questions/i)).toBeInTheDocument();
    expect(screen.getByText(/still matter/i)).toBeInTheDocument();
  });

  it("runs a what-if and keeps facts, estimates and assumptions separate", async () => {
    render(<StrategyView />);
    await userEvent.click(screen.getByRole("button", { name: /postpone a project/i }));
    expect(screen.getByText("Fact")).toBeInTheDocument();
    expect(screen.getByText("Estimate")).toBeInTheDocument();
    expect(screen.getByText("Assumption")).toBeInTheDocument();
  });

  it("shows an empty state when there is nothing to analyse", () => {
    value = { ...value, state: buildStrategy({ ...goalInput(), goals: [] }) };
    render(<StrategyView />);
    expect(screen.getByText(/needs something to reason about/i)).toBeInTheDocument();
  });

  it("refreshes on request", async () => {
    render(<StrategyView />);
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

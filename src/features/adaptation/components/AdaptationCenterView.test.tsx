import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdaptationProposal, Signal } from "../adaptation-model";

const enqueue = vi.fn();
const reload = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/adaptation" }));
vi.mock("../use-adaptation", () => ({ useAdaptation: () => value }));

import { AdaptationCenterView } from "./AdaptationCenterView";

const NOW = "2026-09-10T09:00:00.000Z";

const signal: Signal = {
  id: "sig1",
  type: "CAPACITY_SIGNAL",
  severity: "HIGH",
  statement: "Planned focus exceeds availability",
  evidence: ["18h planned vs 12h available"],
  sourceModule: "twin",
  detectedAt: NOW,
};

const proposal: AdaptationProposal = {
  id: "prop:sig1",
  trigger: "CAPACITY_SIGNAL",
  adaptationType: "REALLOCATE",
  title: "Rebalance planned focus across the week",
  currentState: signal.statement,
  proposedChange: "Rebalance. Nothing changes until you review and approve.",
  expectedImpact: "Capacity pressure should ease if applied.",
  risks: ["Changing course has a switching cost this week."],
  alternatives: ["Keep the current course.", "Simulate the change first."],
  evidence: signal.evidence,
  assumptions: ["Current availability still holds."],
  limitations: [],
  confidence: "high",
  requiresApproval: true,
  status: "PROPOSED",
  stateSignature: "CAPACITY_SIGNAL:Planned focus exceeds availability",
  targetEntityId: null,
  createdAt: NOW,
};

beforeEach(() => {
  enqueue.mockReset();
  reload.mockReset();
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
  value = {
    status: "ready",
    signals: [signal],
    proposals: [proposal],
    activeProposals: [proposal],
    conflicts: [],
    focusHealth: { state: "overloaded", plannedHours: 18, availableHours: 12, reasons: ["18h/wk planned vs 12h/wk available."] },
    systemHealth: { degradedAreas: [], automationsPaused: false, aiAvailable: true, healthy: true },
    notifications: [],
    dailyBrief: { generatedAt: NOW, priorities: [], deadlines: [], conflicts: [], risks: [signal.statement], recommendedActions: [proposal.title] },
    autonomy: { enqueue },
    reload,
  };
});

describe("AdaptationCenterView", () => {
  it("renders signals and an evidence-backed proposal with WHAT/WHY/EVIDENCE/IMPACT/RISKS", () => {
    render(<AdaptationCenterView />);
    expect(screen.getByRole("heading", { name: /signals \(1\)/i })).toBeInTheDocument();
    expect(screen.getAllByText("Planned focus exceeds availability").length).toBeGreaterThan(0);
    expect(screen.getByText("Rebalance planned focus across the week")).toBeInTheDocument();
    expect(screen.getByText("What changed")).toBeInTheDocument();
    expect(screen.getByText("Expected impact")).toBeInTheDocument();
    expect(screen.getAllByText("Risks").length).toBeGreaterThan(0);
  });

  it("approving a proposal routes it to the Trust Center via enqueue", async () => {
    render(<AdaptationCenterView />);
    await userEvent.click(screen.getByRole("button", { name: /approve → trust center/i }));
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "PREPARE_PLAN_DRAFT", title: proposal.title }),
    );
  });

  it("dismissing a proposal removes it from view and persists the dismissal", async () => {
    render(<AdaptationCenterView />);
    await userEvent.click(screen.getByRole("button", { name: /^dismiss$/i }));
    expect(screen.queryByText("Rebalance planned focus across the week")).not.toBeInTheDocument();
  });

  it("shows conflicting adaptations when the engine reports one", () => {
    value = { ...value, conflicts: [{ a: "p1", b: "p2", reason: "Pause and Increase focus disagree." }] };
    render(<AdaptationCenterView />);
    expect(screen.getByRole("heading", { name: /conflicting adaptations/i })).toBeInTheDocument();
  });

  it("shows an empty state when no adaptation is proposed", () => {
    value = { ...value, activeProposals: [], proposals: [] };
    render(<AdaptationCenterView />);
    expect(screen.getByText(/no adaptation proposed right now/i)).toBeInTheDocument();
  });

  it("surfaces degraded system state without hiding deterministic signals", () => {
    value = { ...value, systemHealth: { degradedAreas: ["Intelligence"], automationsPaused: false, aiAvailable: false, healthy: false } };
    render(<AdaptationCenterView />);
    expect(screen.getByText(/system state degraded: intelligence/i)).toBeInTheDocument();
    expect(screen.getAllByText("Planned focus exceeds availability").length).toBeGreaterThan(0);
  });
});

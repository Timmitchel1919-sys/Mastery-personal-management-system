import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdaptationProposal, Signal } from "../adaptation-model";

let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/command" }));
vi.mock("../use-adaptation", () => ({ useAdaptation: () => value }));

import { AdaptationSignalsPanel } from "./AdaptationSignalsPanel";

const NOW = "2026-09-10T09:00:00.000Z";

beforeEach(() => {
  value = { status: "ready", signals: [], activeProposals: [] };
});

describe("AdaptationSignalsPanel", () => {
  it("renders nothing when there is no signal and no proposal", () => {
    const { container } = render(<AdaptationSignalsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while loading", () => {
    value = { status: "loading", signals: [{ id: "s1" }], activeProposals: [] };
    const { container } = render(<AdaptationSignalsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the top signal and the proposal count with a link into Adaptation", () => {
    const signal: Signal = {
      id: "s1",
      type: "GOAL_SIGNAL",
      severity: "HIGH",
      statement: "Goal X is stalled",
      evidence: ["e"],
      sourceModule: "strategy",
      detectedAt: NOW,
    };
    const proposal = { id: "p1" } as AdaptationProposal;
    value = { status: "ready", signals: [signal], activeProposals: [proposal] };
    render(<AdaptationSignalsPanel />);
    expect(screen.getByText("Goal X is stalled")).toBeInTheDocument();
    expect(screen.getByText(/1 adaptation proposal awaiting your review/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open adaptation/i })).toHaveAttribute("href", "/adaptation");
  });
});

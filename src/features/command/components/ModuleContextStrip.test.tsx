import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Signal } from "@/features/adaptation";

let value: { status: "loading" | "ready"; signals: Signal[] };

vi.mock("next/navigation", () => ({ usePathname: () => "/hub" }));
vi.mock("@/features/adaptation", () => ({ useAdaptation: () => value }));

import { ModuleContextStrip } from "./ModuleContextStrip";

const NOW = "2026-09-11T09:00:00.000Z";

beforeEach(() => {
  value = { status: "ready", signals: [] };
});

describe("ModuleContextStrip", () => {
  it("renders nothing when no signal applies to the module", () => {
    const { container } = render(<ModuleContextStrip moduleId="focus" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while loading", () => {
    value = {
      status: "loading",
      signals: [{ id: "s1", type: "GOAL_SIGNAL", severity: "HIGH", statement: "x", evidence: [], sourceModule: "strategy", detectedAt: NOW }],
    };
    const { container } = render(<ModuleContextStrip moduleId="goals" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the top signal relevant to the given module and links to Adaptation", () => {
    value = {
      status: "ready",
      signals: [
        { id: "s1", type: "FOCUS_SIGNAL", severity: "HIGH", statement: "Focus overloaded", evidence: [], sourceModule: "twin", detectedAt: NOW },
        { id: "s2", type: "GOAL_SIGNAL", severity: "HIGH", statement: "Goal stalled", evidence: [], sourceModule: "strategy", detectedAt: NOW },
      ],
    };
    render(<ModuleContextStrip moduleId="focus" />);
    expect(screen.getByText("Focus overloaded")).toBeInTheDocument();
    expect(screen.queryByText("Goal stalled")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review in adaptation/i })).toHaveAttribute("href", "/adaptation");
  });

  it("ignores signals not relevant to the current module", () => {
    value = {
      status: "ready",
      signals: [{ id: "s1", type: "RISK_SIGNAL", severity: "HIGH", statement: "Analytics risk", evidence: [], sourceModule: "strategy", detectedAt: NOW }],
    };
    const { container } = render(<ModuleContextStrip moduleId="goals" />);
    expect(container).toBeEmptyDOMElement();
  });
});

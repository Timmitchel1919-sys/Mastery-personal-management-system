import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MasteryInsight } from "../mastery-intelligence";

const reload = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("../use-intelligence", () => ({ useIntelligence: () => value }));

import { IntelligencePanel } from "./IntelligencePanel";

const insight: MasteryInsight = {
  id: "metric-focus",
  type: "PROGRESS",
  title: "Focus hours is improving",
  summary: "Focus hours changed +20% over the 30 days.",
  detail: "10 h -> 12 h across 6 entries.",
  recommendation: "Consider keeping the current structure in place.",
  severity: "low",
  confidence: "medium",
  signal: "moderate",
  source: ["kpis"],
  relatedModule: "analytics",
  createdAt: "2026-09-09T00:00:00.000Z",
  actions: [{ label: "Open KPIs", href: "/analytics/kpis" }],
  status: "active",
  evidence: ["6 entries this period"],
};

beforeEach(() => {
  reload.mockReset();
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
  value = {
    status: "ready",
    error: null,
    reload,
    hasAnyData: true,
    insights: [insight],
    today: [insight],
    progress: [],
    attention: [],
    patterns: [],
    recommendations: [],
    moduleAttention: {
      goals: { count: 0, topSeverity: null },
      plan: { count: 0, topSeverity: null },
      focus: { count: 0, topSeverity: null },
      act: { count: 0, topSeverity: null },
      grow: { count: 0, topSeverity: null },
      analytics: { count: 0, topSeverity: null },
    },
  };
});

describe("IntelligencePanel", () => {
  it("renders an insight with distinct fact / interpretation / recommendation", async () => {
    render(<IntelligencePanel />);
    expect(await screen.findByText(insight.title)).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Fact")).toBeInTheDocument();
    expect(screen.getByText("Interpretation")).toBeInTheDocument();
    expect(screen.getByText("Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Moderate signal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open kpis/i })).toHaveAttribute(
      "href",
      "/analytics/kpis",
    );
  });

  it("shows an insufficient-data message when there are no insights", async () => {
    value = {
      ...value,
      insights: [],
      today: [],
      progress: [],
      attention: [],
      patterns: [],
      recommendations: [],
    };
    render(<IntelligencePanel />);
    expect(await screen.findByText(/not enough data yet/i)).toBeInTheDocument();
  });

  it("dismisses an insight on request", async () => {
    render(<IntelligencePanel />);
    expect(await screen.findByText(insight.title)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));
    expect(screen.queryByText(insight.title)).not.toBeInTheDocument();
  });

  it("renders an error state with retry", async () => {
    value = { ...value, status: "error", error: "offline" };
    render(<IntelligencePanel />);
    expect(screen.getByText("Intelligence is temporarily unavailable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

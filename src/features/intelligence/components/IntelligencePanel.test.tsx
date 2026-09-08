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
  title: "Focus hours is trending the right way",
  fact: "Focus hours rose 20% over the 30 days (10 h → 12 h).",
  interpretation: "Your data suggests the recent change is working.",
  recommendation: "Consider keeping the current structure in place.",
  signal: "moderate",
  evidence: ["6 entries this period"],
  action: { label: "Open KPIs", href: "/analytics/kpis" },
  kind: "positive",
};

beforeEach(() => {
  reload.mockReset();
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
  value = { status: "ready", error: null, reload, hasAnyData: true, insights: [insight] };
});

describe("IntelligencePanel", () => {
  it("renders an insight with distinct fact / interpretation / recommendation", async () => {
    render(<IntelligencePanel />);
    expect(await screen.findByText(insight.title)).toBeInTheDocument();
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
    value = { ...value, insights: [] };
    render(<IntelligencePanel />);
    expect(await screen.findByText(/not enough activity data yet/i)).toBeInTheDocument();
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

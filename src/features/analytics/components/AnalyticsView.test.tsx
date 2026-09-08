import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyInsight, PeriodComparison } from "../analytics-insights";

const reload = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/analytics" }));
vi.mock("../use-analytics", () => ({ useAnalytics: () => value }));

import { AnalyticsView } from "./AnalyticsView";

const flatComparison: PeriodComparison = {
  current: null,
  previous: null,
  changeAbs: null,
  changePct: null,
  direction: "flat",
  sampleSize: 0,
};

const noInsight: KeyInsight = {
  headline: "No clear pattern yet.",
  detail: "Keep logging.",
  metricLabel: null,
  changePct: null,
  direction: "flat",
  positive: null,
};

beforeEach(() => {
  reload.mockReset();
  value = {
    status: "ready",
    error: null,
    reload,
    period: "30d",
    setPeriod: vi.fn(),
    hasAnyData: true,
    kpis: { items: [], entriesByKpi: new Map() },
    lifeScore: { score: 72 },
    lifeScoreSeries: [],
    lifeScoreComparison: { ...flatComparison, current: 72, previous: 66, changeAbs: 6, changePct: 9, direction: "up", sampleSize: 3 },
    metrics: [],
    rankedMetrics: [],
    insight: noInsight,
    attention: [],
    positive: [],
  };
});

describe("AnalyticsView", () => {
  it("renders the insight, core metrics and detailed-data links from real state", () => {
    render(<AnalyticsView />);
    expect(screen.getByText("No clear pattern yet.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Core metrics" })).toBeInTheDocument();
    expect(screen.getByText("Personal insight")).toBeInTheDocument();
    expect(screen.getAllByText("Life Score").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /KPIs/i })).toHaveAttribute("href", "/analytics/kpis");
  });

  it("shows a contextual empty state when there is no data", () => {
    value.hasAnyData = false;
    render(<AnalyticsView />);
    expect(screen.getByText("Nothing to analyse yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /set up a kpi/i })).toHaveAttribute(
      "href",
      "/analytics/kpis",
    );
  });

  it("renders an error state with a working retry", async () => {
    value = { ...value, status: "error", error: "offline" };
    render(<AnalyticsView />);
    expect(screen.getByText("Analytics couldn't be loaded")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("surfaces attention and positive signals when present", () => {
    value.attention = [{ id: "kpi-x", label: "Sleep down 12%", detail: "8 → 7 h.", href: "/analytics/kpis" }];
    value.positive = [{ id: "life-score", label: "Life Score up 6 points", detail: "66 → 72." }];
    render(<AnalyticsView />);
    expect(screen.getByText("Sleep down 12%")).toBeInTheDocument();
    expect(screen.getByText("Life Score up 6 points")).toBeInTheDocument();
  });
});

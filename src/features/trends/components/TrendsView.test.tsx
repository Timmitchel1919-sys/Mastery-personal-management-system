import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let kpisValue: Record<string, unknown>;
let lifeScoreValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/analytics/trends" }));
vi.mock("@/features/kpis", () => ({ useKpis: () => kpisValue }));
vi.mock("@/features/life-score", () => ({ useLifeScore: () => lifeScoreValue }));

import { TrendsView } from "./TrendsView";

beforeEach(() => {
  kpisValue = {
    status: "ready",
    items: [],
    entriesByKpi: new Map(),
    error: null,
    reload: vi.fn(),
  };
  lifeScoreValue = {
    status: "ready",
    history: [],
    error: null,
    reload: vi.fn(),
  };
});

describe("TrendsView", () => {
  it("shows a no-data state for Life Score with no saved history", () => {
    render(<TrendsView />);
    expect(screen.getByText("No data yet")).toBeInTheDocument();
    expect(screen.getByText("Save a Life Score to start building its trend.")).toBeInTheDocument();
  });

  it("renders the Life Score trend with stats once history exists", () => {
    lifeScoreValue.history = [
      { id: "e1", date: "2026-08-25", score: 40 },
      { id: "e2", date: "2026-09-01", score: 60 },
    ];
    render(<TrendsView />);

    expect(screen.getByRole("img", { name: /life score trend/i })).toBeInTheDocument();
    expect(screen.getByText("Latest")).toBeInTheDocument();
    // two "60" occurrences: latest tile value and max tile value
    expect(screen.getAllByText("60").length).toBeGreaterThan(0);
  });

  it("renders an error with retry", () => {
    kpisValue = { ...kpisValue, status: "error", error: "boom" };
    render(<TrendsView />);
    expect(screen.getByText("We couldn't load your trends")).toBeInTheDocument();
  });
});

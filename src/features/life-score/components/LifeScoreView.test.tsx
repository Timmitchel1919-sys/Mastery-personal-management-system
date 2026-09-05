import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reload = vi.fn();
const saveToday = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/analytics/life-score" }));
vi.mock("../use-life-score", () => ({ useLifeScore: () => hookValue }));

import { LifeScoreView } from "./LifeScoreView";

beforeEach(() => {
  [reload, saveToday].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    score: null,
    factors: [],
    history: [],
    error: null,
    reload,
    saveToday,
  };
});

describe("LifeScoreView", () => {
  it("shows a not-enough-data state and disables saving with no score", () => {
    render(<LifeScoreView />);
    expect(screen.getByText("Not enough data yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save today/i })).toBeDisabled();
  });

  it("renders the score with contributing factors and can save it", async () => {
    hookValue.score = 75;
    hookValue.factors = [
      { kpiId: "k1", title: "Sleep hours", value: 8, attainment: 100, weight: 3 },
    ];
    render(<LifeScoreView />);

    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("Sleep hours")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("weight 3")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /save today/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^save$/i }));
    expect(saveToday).toHaveBeenCalledWith("");
  });

  it("renders score history when there is more than one saved entry", () => {
    hookValue.score = 80;
    hookValue.history = [
      { id: "e1", date: "2026-08-30", score: 60 },
      { id: "e2", date: "2026-09-01", score: 80 },
    ];
    render(<LifeScoreView />);
    expect(screen.getByText("Score history")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<LifeScoreView />);
    expect(screen.getByText("We couldn't load your Life Score")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

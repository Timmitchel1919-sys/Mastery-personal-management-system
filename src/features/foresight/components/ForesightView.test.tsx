import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EarlyWarning, Forecast, TimelineEntry } from "../foresight-model";
import { summarizeCalibration } from "../foresight-model";

const reload = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/predictions" }));
vi.mock("../use-foresight", () => ({ useForesight: () => value }));

import { ForesightView } from "./ForesightView";

const NOW = "2026-09-11T09:00:00.000Z";

const forecast: Forecast = {
  id: "fc1",
  type: "CAPACITY_RISK",
  horizon: "next-7-days",
  kind: "PREDICTION",
  statement: "Planned focus exceeds availability",
  evidence: ["30h planned vs 20h available"],
  assumptions: ["Availability is configured, not measured."],
  confidence: "high",
  impact: "high",
  target: { kind: "capacity", id: null, label: "Weekly capacity" },
  recommendation: "Reprioritize or reschedule some work.",
  createdAt: NOW,
  expiresAt: NOW,
  status: "active",
};

const warning: EarlyWarning = {
  id: "w1",
  kind: "CAPACITY_OVERLOAD",
  forecastId: "fc1",
  statement: forecast.statement,
  action: { label: "Simulate a change", href: "/simulation" },
};

const timeline: TimelineEntry[] = [
  { id: "tl:actual:e1", bucket: "next-7-days", kind: "ACTUAL", label: "Deadline", date: NOW },
  { id: "tl:fc1", bucket: "next-7-days", kind: "PREDICTED", label: forecast.statement, date: null },
];

beforeEach(() => {
  reload.mockReset();
  value = {
    status: "ready",
    activeForecasts: [forecast],
    warnings: [warning],
    timeline,
    calibration: { summary: summarizeCalibration([]) },
    reload,
  };
});

describe("ForesightView", () => {
  it("renders early warnings, the future timeline, and forecast cards", () => {
    render(<ForesightView />);
    expect(screen.getByRole("heading", { name: /early warnings \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /future timeline/i })).toBeInTheDocument();
    expect(screen.getAllByText("Planned focus exceeds availability").length).toBeGreaterThan(0);
    expect(screen.getByText("ACTUAL")).toBeInTheDocument();
    expect(screen.getByText("PREDICTED")).toBeInTheDocument();
  });

  it("expands a forecast card to reveal evidence, confidence, and a separate recommendation", async () => {
    render(<ForesightView />);
    await userEvent.click(screen.getByRole("button", { name: /view details/i }));
    expect(screen.getByText(/30h planned vs 20h available/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence: high/i)).toBeInTheDocument();
    expect(screen.getByText(/reprioritize or reschedule/i)).toBeInTheDocument();
  });

  it("shows an insufficient-data empty state when there is nothing to forecast", () => {
    value = { ...value, activeForecasts: [], warnings: [] };
    render(<ForesightView />);
    expect(screen.getByText(/not enough signal to forecast yet/i)).toBeInTheDocument();
  });

  it("shows that calibration never fabricates accuracy before anything is confirmed", () => {
    render(<ForesightView />);
    expect(screen.getByText(/no confirmed outcomes yet/i)).toBeInTheDocument();
  });

  it("refreshes on request", async () => {
    render(<ForesightView />);
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EarlyWarning, Forecast } from "../foresight-model";

let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/command" }));
vi.mock("../use-foresight", () => ({ useForesight: () => value }));

import { ForesightSignalsPanel } from "./ForesightSignalsPanel";

beforeEach(() => {
  value = { status: "ready", warnings: [], activeForecasts: [] };
});

describe("ForesightSignalsPanel", () => {
  it("renders nothing when there is nothing to forecast", () => {
    const { container } = render(<ForesightSignalsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while loading", () => {
    value = { status: "loading", warnings: [{ id: "w1" } as EarlyWarning], activeForecasts: [] };
    const { container } = render(<ForesightSignalsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the top warning and forecast count with a link into Predictions", () => {
    const warning: EarlyWarning = {
      id: "w1",
      kind: "CAPACITY_OVERLOAD",
      forecastId: "f1",
      statement: "Capacity overload likely next week",
      action: { label: "Simulate", href: "/simulation" },
    };
    value = { status: "ready", warnings: [warning], activeForecasts: [{ id: "f1" } as Forecast] };
    render(<ForesightSignalsPanel />);
    expect(screen.getByText("Capacity overload likely next week")).toBeInTheDocument();
    expect(screen.getByText(/1 active forecast\./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open predictions/i })).toHaveAttribute("href", "/predictions");
  });
});

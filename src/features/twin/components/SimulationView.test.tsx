import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildBaseline,
  calibrateFromHistory,
  compareScenarios,
  defaultAssumptions,
  runSimulation,
  type Scenario,
  type TwinInput,
} from "../digital-twin";

const setStatus = vi.fn();
const create = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/simulation" }));
vi.mock("../use-digital-twin", () => ({ useDigitalTwin: () => value }));

import { SimulationView } from "./SimulationView";

const NOW = "2026-09-10T09:00:00.000Z";

function goal(id: string, progress: number) {
  return {
    id,
    status: "active",
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title: id,
    description: "",
    pillarIds: ["personal"],
    parentPlanId: null,
    startDate: null,
    targetDate: null,
    goalStatus: "in-progress",
    priority: "medium",
    progress,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "weekly",
  };
}

const input: TwinInput = {
  nowIso: NOW,
  goals: [goal("g1", 20), goal("g2", 40)] as never,
  plans: [],
  tasks: [],
  predictions: { enabled: true, status: "ready", signals: [] },
  decisions: [],
};
const baseline = buildBaseline(input);
const calibration = calibrateFromHistory([]);

const savedScenario: Scenario = {
  id: "scn-1",
  name: "Push Goal A",
  horizon: "3m",
  changes: [
    { id: "c1", op: "ACCELERATE", targetKind: "goal", targetLabel: "Goal A", params: { hours: 6 } },
  ],
  assumptions: defaultAssumptions(baseline, calibration),
  status: "SIMULATED",
  version: 1,
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  setStatus.mockReset();
  create.mockReset();
  value = {
    status: "ready",
    baseline,
    calibration,
    library: { scenarios: [savedScenario], create, setStatus, remove: vi.fn(), duplicate: vi.fn() },
    simulate: (scenario: Scenario) => runSimulation(baseline, scenario, calibration),
    compare: (ids: string[]) =>
      compareScenarios(
        ids
          .map((id) => (id === savedScenario.id ? savedScenario : null))
          .filter((s): s is Scenario => Boolean(s))
          .map((s) => runSimulation(baseline, s, calibration)),
      ),
    applyPreview: (scenario: Scenario) => ({
      willModify: { goals: 1, plans: 0, tasks: 0, deadlines: 0 },
      steps: scenario.changes.map((c) => `${c.op} → ${c.targetKind} "${c.targetLabel}"`),
      note: "Applying is a separate, explicit step. Nothing is modified until you confirm.",
    }),
    reload: vi.fn(),
  };
});

describe("SimulationView", () => {
  it("shows the simulation-mode banner and the baseline operational state", () => {
    render(<SimulationView />);
    expect(screen.getByText(/simulation mode — nothing here changes your real data/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /baseline — current operational state/i })).toBeInTheDocument();
    expect(screen.getByText("Active goals")).toBeInTheDocument();
  });

  it("runs a simulation and shows baseline vs projected with fact/projection labels", async () => {
    render(<SimulationView />);
    await userEvent.click(screen.getByRole("button", { name: /^add change$/i }));
    await userEvent.click(screen.getByRole("button", { name: /run simulation/i }));
    const resultPanel = screen.getByRole("region", { name: /result —/i });
    expect(within(resultPanel).getByText("Projected")).toBeInTheDocument();
    expect(within(resultPanel).getAllByText(/projection/i).length).toBeGreaterThan(0);
  });

  it("saves the working scenario to the library", async () => {
    render(<SimulationView />);
    await userEvent.click(screen.getByRole("button", { name: /save scenario/i }));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("opens the apply confirmation and marks the scenario applied without mutating data", async () => {
    render(<SimulationView />);
    await userEvent.click(screen.getByRole("button", { name: /apply…/i }));
    expect(await screen.findByText(/apply .push goal a/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing is modified until you confirm/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /mark applied/i }));
    expect(setStatus).toHaveBeenCalledWith("scn-1", "APPLIED");
  });

  it("compares a saved scenario against the baseline in a table", async () => {
    render(<SimulationView />);
    await userEvent.click(screen.getByRole("button", { name: /^compare$/i }));
    expect(await screen.findByRole("heading", { name: /scenario comparison/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Push Goal A" })).toBeInTheDocument();
  });

  it("shows an insufficient-data empty state when the baseline has no data", () => {
    value = { ...value, baseline: buildBaseline({ ...input, goals: [], plans: [], tasks: [] }) };
    render(<SimulationView />);
    expect(screen.getByText(/insufficient data for reliable simulation/i)).toBeInTheDocument();
  });
});

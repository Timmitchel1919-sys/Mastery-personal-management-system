import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type { Kpi, KpiEntry } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
const addEntry = vi.fn();
const removeEntry = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/analytics/kpis" }));
vi.mock("../use-kpis", () => ({ useKpis: () => hookValue }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [{ id: "goal-1", title: "Grow in faith" }], loading: false }),
}));

import { KpisView } from "./KpisView";

const emptyStats = { total: 0, withEntries: 0, avgAttainment: null };

const kpi: Kpi = {
  id: "k1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Sleep hours",
  description: "",
  category: "Health",
  pillarIds: [],
  unit: "hours",
  direction: "higher-is-better",
  targetValue: 8,
  weight: 3,
  goalId: "goal-1",
  notes: "",
};

const entry: KpiEntry = {
  id: "e1",
  status: "active",
  version: 1,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  kpiId: "k1",
  date: "2026-09-01",
  value: 4,
  note: "",
};

beforeEach(() => {
  [reload, create, update, archive, addEntry, removeEntry].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    entries: [],
    entriesByKpi: new Map(),
    stats: emptyStats,
    error: null,
    reload,
    create,
    update,
    archive,
    addEntry,
    removeEntry,
  };
});

describe("KpisView", () => {
  it("shows the empty state", () => {
    render(<KpisView />);
    expect(screen.getByText("No KPIs yet")).toBeInTheDocument();
  });

  it("renders a KPI card with category, attainment, target, and goal link", () => {
    hookValue.items = [kpi];
    hookValue.entriesByKpi = new Map([["k1", [entry]]]);
    hookValue.stats = { total: 1, withEntries: 1, avgAttainment: 50 };
    render(<KpisView />);

    expect(screen.getByRole("heading", { name: "Sleep hours" })).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getByText(/target 8 hours/)).toBeInTheDocument();
    expect(screen.getByText("Grow in faith")).toBeInTheDocument();
  });

  it("opens the add-entry dialog for a KPI", async () => {
    hookValue.items = [kpi];
    render(<KpisView />);

    await userEvent.click(screen.getByRole("button", { name: /add entry/i }));
    expect(
      await screen.findByRole("heading", { name: /add an entry — Sleep hours/i }),
    ).toBeInTheDocument();
  });

  it("opens the new-KPI dialog", async () => {
    render(<KpisView />);
    await userEvent.click(screen.getByRole("button", { name: /new kpi/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(<KpisView />);
    expect(screen.getByText("We couldn't load your KPIs")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

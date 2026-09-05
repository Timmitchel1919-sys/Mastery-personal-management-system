import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Report } from "../report-schema";
import type { ReportData } from "../report-data";

const generate = vi.fn();
const reload = vi.fn();
const clearCurrent = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/analytics/reports" }));
vi.mock("../use-reports", () => ({ useReports: () => hookValue }));

import { ReportsView } from "./ReportsView";

const report: Report = {
  id: "r1",
  status: "active",
  version: 1,
  createdAt: "2026-09-05T12:00:00.000Z",
  updatedAt: "2026-09-05T12:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Last 7 days · 2026-09-05",
  period: "weekly",
  periodStart: "2026-08-30",
  periodEnd: "2026-09-05",
  sections: ["summary", "goals"],
  format: "pdf",
  generatedAt: "2026-09-05T12:00:00.000Z",
};

const reportData: ReportData = {
  range: { start: "2026-08-30", end: "2026-09-05" },
  generatedAt: "2026-09-05T12:00:00.000Z",
  sections: ["summary"],
  summary: {
    goalsAchieved: 0,
    milestonesCompleted: 0,
    tasksCompleted: 4,
    focusMinutes: 100,
    habitConsistencyPercent: null,
    activeKpis: 1,
  },
  goals: null,
  habits: null,
  focus: null,
  kpis: null,
  planning: null,
};

beforeEach(() => {
  [generate, reload, clearCurrent].forEach((fn) => fn.mockReset());
  generate.mockResolvedValue(reportData);
  hookValue = {
    status: "ready",
    history: [],
    error: null,
    reload,
    generate,
    generating: false,
    generateError: null,
    current: null,
    clearCurrent,
  };
});

describe("ReportsView", () => {
  it("shows the generate form, the recovery note, and an empty history", () => {
    render(<ReportsView />);
    expect(screen.getByRole("heading", { name: "New report" })).toBeInTheDocument();
    expect(screen.getByText("A report never includes Recovery Center data.")).toBeInTheDocument();
    expect(screen.getByText("No reports yet")).toBeInTheDocument();
  });

  it("generates a report from the default selection", async () => {
    render(<ReportsView />);
    await userEvent.click(screen.getByRole("button", { name: /generate report/i }));
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        period: "weekly",
        sections: ["summary", "goals", "habits", "focus", "kpis", "planning"],
      }),
    );
  });

  it("lists past reports in the history", () => {
    hookValue.history = [report];
    render(<ReportsView />);
    expect(screen.getByText("Last 7 days · 2026-09-05")).toBeInTheDocument();
    expect(screen.getByText(/2 sections/)).toBeInTheDocument();
  });

  it("renders the document and a working print button once a report is current", async () => {
    hookValue.current = reportData;
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<ReportsView />);
    expect(screen.getByText("Mastery")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});

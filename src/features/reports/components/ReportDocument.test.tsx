import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReportData } from "../report-data";
import { ReportDocument } from "./ReportDocument";

const base: ReportData = {
  range: { start: "2026-09-01", end: "2026-09-07" },
  generatedAt: "2026-09-07T12:00:00.000Z",
  sections: ["summary", "goals"],
  summary: {
    goalsAchieved: 2,
    milestonesCompleted: 1,
    tasksCompleted: 9,
    focusMinutes: 240,
    habitConsistencyPercent: 71,
    activeKpis: 3,
  },
  goals: {
    achieved: [{ title: "Shipped v1" }],
    inProgress: [{ title: "Docs", progress: 60 }],
    milestonesCompleted: [{ title: "Beta" }],
  },
  habits: null,
  focus: null,
  kpis: null,
  planning: null,
};

describe("ReportDocument", () => {
  it("renders the Mastery header, the period, and the selected sections", () => {
    render(<ReportDocument data={base} period="weekly" />);
    expect(screen.getByText("Mastery")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Last 7 days" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Goals & milestones" })).toBeInTheDocument();
    expect(screen.getByText("Shipped v1")).toBeInTheDocument();
    expect(screen.getByText("Docs — 60%")).toBeInTheDocument();
    expect(screen.getByText(/Recovery Center data is never included/i)).toBeInTheDocument();
  });

  it("shows an empty note for a requested section with no data", () => {
    render(
      <ReportDocument
        data={{
          ...base,
          sections: ["goals"],
          summary: null,
          goals: { achieved: [], inProgress: [], milestonesCompleted: [] },
        }}
        period="monthly"
      />,
    );
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Overview" })).not.toBeInTheDocument();
  });

  it("does not render a section that was not selected", () => {
    render(<ReportDocument data={base} period="weekly" />);
    expect(screen.queryByRole("heading", { name: "KPIs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Habits" })).not.toBeInTheDocument();
  });
});

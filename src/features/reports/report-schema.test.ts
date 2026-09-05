import { describe, expect, it } from "vitest";
import {
  defaultReportTitle,
  reportFormSchema,
  reportSchema,
  resolvePeriodRange,
} from "./report-schema";

describe("reportFormSchema", () => {
  it("requires at least one section", () => {
    expect(
      reportFormSchema.safeParse({
        period: "weekly",
        periodStart: "",
        periodEnd: "",
        sections: [],
      }).success,
    ).toBe(false);
  });

  it("requires both dates for a custom range and rejects an inverted range", () => {
    expect(
      reportFormSchema.safeParse({
        period: "custom",
        periodStart: "",
        periodEnd: "",
        sections: ["summary"],
      }).success,
    ).toBe(false);
    expect(
      reportFormSchema.safeParse({
        period: "custom",
        periodStart: "2026-02-01",
        periodEnd: "2026-01-01",
        sections: ["summary"],
      }).success,
    ).toBe(false);
    expect(
      reportFormSchema.safeParse({
        period: "custom",
        periodStart: "2026-01-01",
        periodEnd: "2026-02-01",
        sections: ["summary", "kpis"],
      }).success,
    ).toBe(true);
  });
});

describe("resolvePeriodRange", () => {
  const today = new Date("2026-09-05T12:00:00.000Z");

  it("maps 'weekly' to an inclusive 7-day window ending today", () => {
    expect(resolvePeriodRange({ period: "weekly", periodStart: "", periodEnd: "" }, today)).toEqual(
      {
        start: "2026-08-30",
        end: "2026-09-05",
      },
    );
  });

  it("maps 'annual' to a 365-day window", () => {
    const r = resolvePeriodRange({ period: "annual", periodStart: "", periodEnd: "" }, today);
    expect(r.end).toBe("2026-09-05");
    expect(r.start).toBe("2025-09-06");
  });

  it("passes a custom range straight through", () => {
    expect(
      resolvePeriodRange(
        { period: "custom", periodStart: "2026-01-01", periodEnd: "2026-03-31" },
        today,
      ),
    ).toEqual({ start: "2026-01-01", end: "2026-03-31" });
  });
});

describe("defaultReportTitle", () => {
  it("names a preset report by its end date and a custom one by its range", () => {
    expect(defaultReportTitle("weekly", { start: "2026-08-30", end: "2026-09-05" })).toContain(
      "2026-09-05",
    );
    expect(defaultReportTitle("custom", { start: "2026-01-01", end: "2026-03-31" })).toBe(
      "Report · 2026-01-01 to 2026-03-31",
    );
  });
});

describe("reportSchema", () => {
  it("validates a stored metadata record", () => {
    const record = reportSchema.parse({
      id: "r1",
      title: "Last 7 days · 2026-09-05",
      period: "weekly",
      periodStart: "2026-08-30",
      periodEnd: "2026-09-05",
      sections: ["summary", "goals"],
      format: "pdf",
      generatedAt: "2026-09-05T12:00:00.000Z",
      status: "active",
      version: 1,
      createdAt: "2026-09-05T12:00:00.000Z",
      updatedAt: "2026-09-05T12:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.sections).toEqual(["summary", "goals"]);
  });
});

import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";

/**
 * Reports (Layer 16) — `users/{uid}/reports/{reportId}` stores **export metadata** only
 * (title, period, section selection, when it was generated). The report itself is composed
 * on the client from the domain repositories and rendered to a branded, print-styled page;
 * the downloadable record is the browser's native "Save as PDF". Per
 * `docs/PRODUCT_REQUIREMENTS.md` §11 a report **never** includes Recovery Center data — the
 * aggregation in `report-data.ts` only ever reads non-recovery collections.
 */

export const REPORT_SECTIONS = ["summary", "goals", "habits", "focus", "kpis", "planning"] as const;
export const reportSectionSchema = z.enum(REPORT_SECTIONS);
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const REPORT_SECTION_LABEL: Record<ReportSection, string> = {
  summary: "Overview",
  goals: "Goals & milestones",
  habits: "Habits",
  focus: "Focus time",
  kpis: "KPIs",
  planning: "Planning vs execution",
};

export const REPORT_SECTION_DESCRIPTION: Record<ReportSection, string> = {
  summary: "Headline counts for the period.",
  goals: "Goals achieved and still in progress, milestones completed.",
  habits: "Per-habit consistency across the period.",
  focus: "Total focus minutes, sessions, and the longest stretch.",
  kpis: "Each KPI's movement from the start of the period to the end.",
  planning: "On-time vs late completions, cancellations, and still-overdue tasks.",
};

export const REPORT_PERIODS = ["weekly", "monthly", "quarterly", "annual", "custom"] as const;
export const reportPeriodSchema = z.enum(REPORT_PERIODS);
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABEL: Record<ReportPeriod, string> = {
  weekly: "Last 7 days",
  monthly: "Last 30 days",
  quarterly: "Last 90 days",
  annual: "Last 365 days",
  custom: "Custom range",
};

const reportFieldsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  period: reportPeriodSchema,
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  sections: z.array(reportSectionSchema).min(1),
  format: z.literal("pdf"),
  generatedAt: z.string(),
});

export const reportSchema = defineRecordSchema(reportFieldsSchema.shape);
export type Report = z.infer<typeof reportSchema>;

export const reportCreateSchema = reportFieldsSchema;
export type ReportCreate = z.infer<typeof reportCreateSchema>;

export const reportUpdateSchema = reportFieldsSchema.partial();
export type ReportUpdate = z.infer<typeof reportUpdateSchema>;

// ── Generate form ────────────────────────────────────────────────────────────
export const reportFormSchema = z
  .object({
    period: reportPeriodSchema,
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
    sections: z.array(reportSectionSchema).min(1, "Pick at least one section"),
  })
  .refine(
    (data) => data.period !== "custom" || (Boolean(data.periodStart) && Boolean(data.periodEnd)),
    { path: ["periodStart"], message: "A custom range needs both dates" },
  )
  .refine((data) => !data.periodStart || !data.periodEnd || data.periodStart <= data.periodEnd, {
    path: ["periodEnd"],
    message: "End date is before the start date",
  });
export type ReportFormValues = z.infer<typeof reportFormSchema>;

const PRESET_DAYS: Record<Exclude<ReportPeriod, "custom">, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  annual: 365,
};

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Resolves a period preset (or a custom form range) into an inclusive `{start, end}`. */
export function resolvePeriodRange(
  values: Pick<ReportFormValues, "period" | "periodStart" | "periodEnd">,
  today = new Date(),
): { start: string; end: string } {
  if (values.period === "custom") {
    return { start: values.periodStart, end: values.periodEnd };
  }
  const end = isoDay(today);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (PRESET_DAYS[values.period] - 1));
  return { start: isoDay(start), end };
}

export function defaultReportTitle(
  period: ReportPeriod,
  range: { start: string; end: string },
): string {
  return period === "custom"
    ? `Report · ${range.start} to ${range.end}`
    : `${REPORT_PERIOD_LABEL[period]} · ${range.end}`;
}

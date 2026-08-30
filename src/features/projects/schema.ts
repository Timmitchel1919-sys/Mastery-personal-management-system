import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarsSchema, prioritySchema } from "@/lib/validation/domain";

/** Projects (Layer 8E) — delivery vehicles that sit under a goal and roll up to pillars. */

export const PROJECT_STATUSES = ["planned", "active", "blocked", "complete", "cancelled"] as const;
export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  active: "Active",
  blocked: "Blocked",
  complete: "Complete",
  cancelled: "Cancelled",
};

const shortLine = z.string().trim().min(1).max(240);
const lineList = z.array(shortLine).max(30);
const datesInOrder = (data: { startDate: string | null; endDate: string | null }) =>
  !data.startDate || !data.endDate || data.startDate <= data.endDate;

const projectFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the project a title").max(160),
  description: z.string().trim().max(4000),
  expectedOutcome: z.string().trim().max(2000),
  pillarIds: lifePillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
  owner: z.string().trim().max(120),
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  projectStatus: projectStatusSchema,
  priority: prioritySchema,
  progress: z.number().int().min(0).max(100),
  dependencies: lineList,
  risks: lineList,
  reviewNotes: z.string().trim().max(4000),
});

export const projectSchema = defineRecordSchema(projectFieldsSchema.shape);
export type Project = z.infer<typeof projectSchema>;

export const projectCreateSchema = projectFieldsSchema.refine(datesInOrder, {
  path: ["endDate"],
  message: "End date must be on or after the start date",
});
export type ProjectCreate = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectFieldsSchema.partial();
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

export const projectFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the project a title").max(160),
    description: z.string().trim().max(4000),
    expectedOutcome: z.string().trim().max(2000),
    pillarIds: lifePillarsSchema,
    goalId: z.string(),
    owner: z.string().trim().max(120),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    projectStatus: projectStatusSchema,
    priority: prioritySchema,
    progress: z.number().int().min(0).max(100),
    dependencies: lineList,
    risks: lineList,
    reviewNotes: z.string().trim().max(4000),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function projectInputFromForm(values: ProjectFormValues): ProjectCreate {
  return {
    title: values.title,
    description: values.description,
    expectedOutcome: values.expectedOutcome,
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
    owner: values.owner,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    projectStatus: values.projectStatus,
    priority: values.priority,
    progress: values.progress,
    dependencies: values.dependencies,
    risks: values.risks,
    reviewNotes: values.reviewNotes,
  };
}

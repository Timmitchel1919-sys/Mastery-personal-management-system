import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarsSchema } from "@/lib/validation/domain";

/**
 * Roadmaps (Layer 8G) — timeline-oriented plans made of ordered phases. They can cover a
 * goal, a project, skill development, a learning plan, or a personal transformation
 * program, and optionally link to a goal and / or a project.
 */

export const ROADMAP_KINDS = [
  "goal",
  "project",
  "skill",
  "learning",
  "transformation",
  "other",
] as const;
export const roadmapKindSchema = z.enum(ROADMAP_KINDS);
export type RoadmapKind = (typeof ROADMAP_KINDS)[number];

export const ROADMAP_KIND_LABEL: Record<RoadmapKind, string> = {
  goal: "Goal",
  project: "Project",
  skill: "Skill development",
  learning: "Learning plan",
  transformation: "Transformation program",
  other: "Other",
};

export const ROADMAP_STATUSES = ["planning", "active", "on-hold", "complete"] as const;
export const roadmapStatusSchema = z.enum(ROADMAP_STATUSES);
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const ROADMAP_STATUS_LABEL: Record<RoadmapStatus, string> = {
  planning: "Planning",
  active: "Active",
  "on-hold": "On hold",
  complete: "Complete",
};

export const PHASE_STATUSES = ["upcoming", "in-progress", "done"] as const;
export const phaseStatusSchema = z.enum(PHASE_STATUSES);
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  upcoming: "Upcoming",
  "in-progress": "In progress",
  done: "Done",
};

export const MAX_ROADMAP_PHASES = 24;

const datesInOrder = (data: { startDate: string | null; endDate: string | null }) =>
  !data.startDate || !data.endDate || data.startDate <= data.endDate;
const DATE_ORDER_ISSUE = {
  path: ["endDate"],
  message: "End date must be on or after the start date",
};

const roadmapPhaseSchema = z
  .object({
    name: z.string().trim().min(1, "Name the phase").max(120),
    startDate: isoDateSchema.nullable(),
    endDate: isoDateSchema.nullable(),
    phaseStatus: phaseStatusSchema,
  })
  .refine(datesInOrder, DATE_ORDER_ISSUE);
export type RoadmapPhase = z.infer<typeof roadmapPhaseSchema>;

const roadmapFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the roadmap a title").max(160),
  description: z.string().trim().max(4000),
  pillarIds: lifePillarsSchema,
  roadmapKind: roadmapKindSchema,
  linkedGoalId: z.string().trim().min(1).nullable(),
  linkedProjectId: z.string().trim().min(1).nullable(),
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  roadmapStatus: roadmapStatusSchema,
  progress: z.number().int().min(0).max(100),
  phases: z.array(roadmapPhaseSchema).max(MAX_ROADMAP_PHASES),
  notes: z.string().trim().max(4000),
});

export const roadmapSchema = defineRecordSchema(roadmapFieldsSchema.shape);
export type Roadmap = z.infer<typeof roadmapSchema>;

export const roadmapCreateSchema = roadmapFieldsSchema.refine(datesInOrder, DATE_ORDER_ISSUE);
export type RoadmapCreate = z.infer<typeof roadmapCreateSchema>;

export const roadmapUpdateSchema = roadmapFieldsSchema.partial();
export type RoadmapUpdate = z.infer<typeof roadmapUpdateSchema>;

const formDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date");

export const roadmapPhaseFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name the phase").max(120),
    startDate: formDate,
    endDate: formDate,
    phaseStatus: phaseStatusSchema,
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });
export type RoadmapPhaseFormValues = z.infer<typeof roadmapPhaseFormSchema>;

export const roadmapFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the roadmap a title").max(160),
    description: z.string().trim().max(4000),
    pillarIds: lifePillarsSchema,
    roadmapKind: roadmapKindSchema,
    linkedGoalId: z.string(),
    linkedProjectId: z.string(),
    startDate: formDate,
    endDate: formDate,
    roadmapStatus: roadmapStatusSchema,
    progress: z.number().int().min(0).max(100),
    phases: z.array(roadmapPhaseFormSchema).max(MAX_ROADMAP_PHASES),
    notes: z.string().trim().max(4000),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });
export type RoadmapFormValues = z.infer<typeof roadmapFormSchema>;

export function roadmapInputFromForm(values: RoadmapFormValues): RoadmapCreate {
  return {
    title: values.title,
    description: values.description,
    pillarIds: values.pillarIds,
    roadmapKind: values.roadmapKind,
    linkedGoalId: values.linkedGoalId || null,
    linkedProjectId: values.linkedProjectId || null,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    roadmapStatus: values.roadmapStatus,
    progress: values.progress,
    phases: values.phases.map((phase) => ({
      name: phase.name,
      startDate: phase.startDate || null,
      endDate: phase.endDate || null,
      phaseStatus: phase.phaseStatus,
    })),
    notes: values.notes,
  };
}

import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarsSchema } from "@/lib/validation/domain";

/**
 * Milestones (Layer 8F) — checkpoints on the way to a goal or a project. They carry a due
 * date, a completion state, manual progress, free-text dependencies, and evidence / notes.
 */

export const MILESTONE_STATUSES = ["upcoming", "in-progress", "done", "missed"] as const;
export const milestoneStatusSchema = z.enum(MILESTONE_STATUSES);
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  upcoming: "Upcoming",
  "in-progress": "In progress",
  done: "Done",
  missed: "Missed",
};

/** What a milestone hangs off. `none` means it is a standalone checkpoint. */
export const MILESTONE_PARENT_TYPES = ["none", "goal", "project"] as const;
export const milestoneParentTypeSchema = z.enum(MILESTONE_PARENT_TYPES);
export type MilestoneParentType = (typeof MILESTONE_PARENT_TYPES)[number];

export const MILESTONE_PARENT_TYPE_LABEL: Record<MilestoneParentType, string> = {
  none: "Standalone",
  goal: "Goal",
  project: "Project",
};

const shortLine = z.string().trim().min(1).max(240);
const lineList = z.array(shortLine).max(30);

/** A milestone linked to a goal / project must name its parent; a standalone one must not. */
const parentIsConsistent = (data: { parentType: MilestoneParentType; parentId: string | null }) =>
  data.parentType === "none" ? data.parentId === null : data.parentId !== null;
const PARENT_ISSUE = {
  path: ["parentId"],
  message: "Choose which goal or project this milestone belongs to",
};

const milestoneFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the milestone a title").max(160),
  description: z.string().trim().max(4000),
  pillarIds: lifePillarsSchema,
  parentType: milestoneParentTypeSchema,
  parentId: z.string().trim().min(1).nullable(),
  dueDate: isoDateSchema.nullable(),
  milestoneStatus: milestoneStatusSchema,
  progress: z.number().int().min(0).max(100),
  dependencies: lineList,
  evidence: z.string().trim().max(4000),
});

export const milestoneSchema = defineRecordSchema(milestoneFieldsSchema.shape);
export type Milestone = z.infer<typeof milestoneSchema>;

export const milestoneCreateSchema = milestoneFieldsSchema.refine(parentIsConsistent, PARENT_ISSUE);
export type MilestoneCreate = z.infer<typeof milestoneCreateSchema>;

export const milestoneUpdateSchema = milestoneFieldsSchema.partial();
export type MilestoneUpdate = z.infer<typeof milestoneUpdateSchema>;

export const milestoneFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the milestone a title").max(160),
    description: z.string().trim().max(4000),
    pillarIds: lifePillarsSchema,
    parentType: milestoneParentTypeSchema,
    parentId: z.string(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use a YYYY-MM-DD date"),
    milestoneStatus: milestoneStatusSchema,
    progress: z.number().int().min(0).max(100),
    dependencies: lineList,
    evidence: z.string().trim().max(4000),
  })
  .refine((data) => data.parentType === "none" || data.parentId.length > 0, {
    path: ["parentId"],
    message: "Choose which goal or project this milestone belongs to",
  });
export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

export function milestoneInputFromForm(values: MilestoneFormValues): MilestoneCreate {
  const parentId = values.parentType === "none" ? null : values.parentId || null;
  return {
    title: values.title,
    description: values.description,
    pillarIds: values.pillarIds,
    parentType: values.parentType,
    parentId,
    dueDate: values.dueDate || null,
    milestoneStatus: values.milestoneStatus,
    progress: values.progress,
    dependencies: values.dependencies,
    evidence: values.evidence,
  };
}

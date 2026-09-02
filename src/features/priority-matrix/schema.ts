import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Priority Matrix (Layer 9E) — `users/{uid}/priorityMatrixItems`. An Eisenhower matrix:
 * every item sits in exactly one of four quadrants and can be moved between them. `task`
 * linkage from the spec waits for the Act domain (Layer 10); `goal` / `project` links are
 * real ids here, matching 9A–9D.
 */

export const MATRIX_QUADRANTS = ["do", "schedule", "delegate", "eliminate"] as const;
export const matrixQuadrantSchema = z.enum(MATRIX_QUADRANTS);
export type MatrixQuadrant = (typeof MATRIX_QUADRANTS)[number];

export interface MatrixQuadrantMeta {
  label: string;
  urgent: boolean;
  important: boolean;
  summary: string;
  advice: string;
}

export const MATRIX_QUADRANT_META: Record<MatrixQuadrant, MatrixQuadrantMeta> = {
  do: {
    label: "Do",
    urgent: true,
    important: true,
    summary: "Urgent & important",
    advice: "Do these now.",
  },
  schedule: {
    label: "Schedule",
    urgent: false,
    important: true,
    summary: "Important, not urgent",
    advice: "Plan a time for these.",
  },
  delegate: {
    label: "Delegate",
    urgent: true,
    important: false,
    summary: "Urgent, not important",
    advice: "Hand these off if you can.",
  },
  eliminate: {
    label: "Eliminate",
    urgent: false,
    important: false,
    summary: "Neither urgent nor important",
    advice: "Drop these.",
  },
};

const matrixItemPillarsSchema = z.array(lifePillarSchema).max(3);

const matrixItemFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the item a title").max(200),
  quadrant: matrixQuadrantSchema,
  note: z.string().trim().max(2000),
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
  pillarIds: matrixItemPillarsSchema,
  completed: z.boolean(),
});

export const matrixItemSchema = defineRecordSchema(matrixItemFieldsSchema.shape);
export type MatrixItem = z.infer<typeof matrixItemSchema>;

export const matrixItemCreateSchema = matrixItemFieldsSchema;
export type MatrixItemCreate = z.infer<typeof matrixItemCreateSchema>;

export const matrixItemUpdateSchema = matrixItemFieldsSchema.partial();
export type MatrixItemUpdate = z.infer<typeof matrixItemUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const matrixItemFormSchema = z.object({
  title: z.string().trim().min(1, "Give the item a title").max(200),
  quadrant: matrixQuadrantSchema,
  note: z.string().trim().max(2000),
  goalId: z.string(),
  projectId: z.string(),
  pillarIds: matrixItemPillarsSchema,
  completed: z.boolean(),
});
export type MatrixItemFormValues = z.infer<typeof matrixItemFormSchema>;

export function matrixItemInputFromForm(values: MatrixItemFormValues): MatrixItemCreate {
  return {
    title: values.title,
    quadrant: values.quadrant,
    note: values.note,
    goalId: values.goalId || null,
    projectId: values.projectId || null,
    pillarIds: values.pillarIds,
    completed: values.completed,
  };
}

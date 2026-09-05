import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";

/**
 * Weekly AI Summary (Layer 14) — client side of `functions/src/scheduled/**`. Written
 * only by the scheduled Cloud Function (Admin SDK); the client reads its history and can
 * archive or delete an entry, per `docs/AI_ARCHITECTURE.md` §6.
 */

const kpiMovementSchema = z.object({
  title: z.string(),
  from: z.number().nullable(),
  to: z.number(),
});
export type KpiMovement = z.infer<typeof kpiMovementSchema>;

const weeklySummaryFieldsSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  goalsCompleted: z.array(z.string()),
  milestonesCompleted: z.array(z.string()),
  tasksCompleted: z.number(),
  tasksCompletedOnTime: z.number(),
  tasksCompletedLate: z.number(),
  tasksCancelled: z.number(),
  tasksStillOverdue: z.number(),
  habitConsistencyPercent: z.number().nullable(),
  focusMinutes: z.number(),
  kpiMovements: z.array(kpiMovementSchema),
  lessons: z.array(z.string()),
  suggestedPriorities: z.array(z.string()),
});

export const weeklySummarySchema = defineRecordSchema(weeklySummaryFieldsSchema.shape);
export type WeeklySummary = z.infer<typeof weeklySummarySchema>;

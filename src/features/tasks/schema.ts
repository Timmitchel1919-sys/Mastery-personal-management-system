import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema, isoDateTimeSchema } from "@/lib/validation";
import { lifePillarSchema, prioritySchema } from "@/lib/validation/domain";

/**
 * Tasks (Layer 10A) — `users/{uid}/tasks`. Opens the Act domain. A task carries status,
 * priority, dates, links up the planning cascade (goal / project / milestone), an optional
 * parent task (subtasks are tasks with a `parentTaskId`), a light recurrence rule, effort
 * and energy metadata, GTD-style context + tags, a completion timestamp, and a resolution
 * reason for blocked / cancelled work.
 */

export const TASK_STATUSES = ["todo", "in-progress", "blocked", "done", "cancelled"] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

/** Statuses that take the task off the active work list. */
export const TASK_CLOSED_STATUSES: readonly TaskStatus[] = ["done", "cancelled"];

export const TASK_ENERGY_LEVELS = ["low", "medium", "high"] as const;
export const taskEnergySchema = z.enum(TASK_ENERGY_LEVELS);
export type TaskEnergy = (typeof TASK_ENERGY_LEVELS)[number];

export const TASK_RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export const taskRecurrenceFrequencySchema = z.enum(TASK_RECURRENCE_FREQUENCIES);
export type TaskRecurrenceFrequency = (typeof TASK_RECURRENCE_FREQUENCIES)[number];

export const TASK_RECURRENCE_FREQUENCY_LABEL: Record<TaskRecurrenceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

/** Light recurrence rule stored on the task. Instance generation is deferred (see notes). */
export const taskRecurrenceSchema = z.object({
  frequency: taskRecurrenceFrequencySchema,
  interval: z.number().int().min(1).max(365),
});
export type TaskRecurrence = z.infer<typeof taskRecurrenceSchema>;

const taskPillarsSchema = z.array(lifePillarSchema).max(3);
const tagSchema = z.string().trim().min(1).max(40);
const tagsSchema = z.array(tagSchema).max(20);

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(200),
  description: z.string().trim().max(4000),
  taskStatus: taskStatusSchema,
  priority: prioritySchema,
  startDate: isoDateSchema.nullable(),
  dueDate: isoDateSchema.nullable(),
  pillarIds: taskPillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
  milestoneId: z.string().trim().min(1).nullable(),
  parentTaskId: z.string().trim().min(1).nullable(),
  recurrence: taskRecurrenceSchema.nullable(),
  estimatedMinutes: z.number().int().min(0).max(100_000),
  actualMinutes: z.number().int().min(0).max(100_000),
  energyRequirement: taskEnergySchema,
  context: z.string().trim().max(80),
  tags: tagsSchema,
  notes: z.string().trim().max(4000),
  completedAt: isoDateTimeSchema.nullable(),
  resolutionReason: z.string().trim().max(500),
});

const datesOrdered = (data: { startDate: string | null; dueDate: string | null }) =>
  !data.startDate || !data.dueDate || data.startDate <= data.dueDate;
const DATE_ORDER_ISSUE = {
  path: ["dueDate"],
  message: "The due date must be on or after the start date",
};

export const taskSchema = defineRecordSchema(taskFieldsSchema.shape);
export type Task = z.infer<typeof taskSchema>;

export const taskCreateSchema = taskFieldsSchema.refine(datesOrdered, DATE_ORDER_ISSUE);
export type TaskCreate = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = taskFieldsSchema.partial();
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;

export function isClosed(status: TaskStatus): boolean {
  return TASK_CLOSED_STATUSES.includes(status);
}

// ── Form shape ────────────────────────────────────────────────────────────────
export const TASK_RECURRENCE_OPTIONS = ["none", ...TASK_RECURRENCE_FREQUENCIES] as const;
export type TaskRecurrenceOption = (typeof TASK_RECURRENCE_OPTIONS)[number];

const isoDateOrEmpty = z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date");

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the task a title").max(200),
    description: z.string().trim().max(4000),
    taskStatus: taskStatusSchema,
    priority: prioritySchema,
    startDate: isoDateOrEmpty,
    dueDate: isoDateOrEmpty,
    pillarIds: taskPillarsSchema,
    goalId: z.string(),
    projectId: z.string(),
    milestoneId: z.string(),
    parentTaskId: z.string(),
    recurrence: z.enum(TASK_RECURRENCE_OPTIONS),
    recurrenceInterval: z.number().int().min(1).max(365),
    estimatedMinutes: z.number().int().min(0).max(100_000),
    actualMinutes: z.number().int().min(0).max(100_000),
    energyRequirement: taskEnergySchema,
    context: z.string().trim().max(80),
    tags: tagsSchema,
    notes: z.string().trim().max(4000),
    resolutionReason: z.string().trim().max(500),
  })
  .refine((d) => !d.startDate || !d.dueDate || d.startDate <= d.dueDate, {
    path: ["dueDate"],
    message: "The due date must be on or after the start date",
  });
export type TaskFormValues = z.infer<typeof taskFormSchema>;

/**
 * Map the form shape to a `TaskCreate`. Sets `completedAt` to now when the status becomes
 * `done` (and clears it otherwise); `previousCompletedAt` preserves an existing timestamp
 * on edit so re-saving a done task doesn't move its completion time.
 */
export function taskInputFromForm(
  values: TaskFormValues,
  previousCompletedAt: string | null = null,
  now: Date = new Date(),
): TaskCreate {
  const completedAt =
    values.taskStatus === "done" ? (previousCompletedAt ?? now.toISOString()) : null;

  return {
    title: values.title,
    description: values.description,
    taskStatus: values.taskStatus,
    priority: values.priority,
    startDate: values.startDate || null,
    dueDate: values.dueDate || null,
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
    projectId: values.projectId || null,
    milestoneId: values.milestoneId || null,
    parentTaskId: values.parentTaskId || null,
    recurrence:
      values.recurrence === "none"
        ? null
        : { frequency: values.recurrence, interval: values.recurrenceInterval },
    estimatedMinutes: values.estimatedMinutes,
    actualMinutes: values.actualMinutes,
    energyRequirement: values.energyRequirement,
    context: values.context,
    tags: [...new Set(values.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 20),
    notes: values.notes,
    completedAt,
    resolutionReason: values.resolutionReason,
  };
}

/** Whole days a task is overdue relative to `today` (a `YYYY-MM-DD` string); 0 if not. */
export function daysOverdue(task: Pick<Task, "dueDate" | "taskStatus">, today: string): number {
  if (!task.dueDate || isClosed(task.taskStatus) || task.dueDate >= today) return 0;
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${task.dueDate}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

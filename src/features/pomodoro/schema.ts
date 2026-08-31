import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateTimeSchema } from "@/lib/validation";

/**
 * Pomodoro (Layer 9A). The *live* timer state lives in `localStorage` (see
 * `pomodoro-store.ts`) so it survives reload and navigation; only a terminal session —
 * completed or ended early — is written to `users/{uid}/pomodoroSessions`.
 */

export const POMODORO_PHASES = ["idle", "work", "short-break", "long-break"] as const;
export const pomodoroPhaseSchema = z.enum(POMODORO_PHASES);
export type PomodoroPhase = (typeof POMODORO_PHASES)[number];

export const PHASE_LABEL: Record<PomodoroPhase, string> = {
  idle: "Ready",
  work: "Focus",
  "short-break": "Short break",
  "long-break": "Long break",
};

export const POMODORO_OUTCOMES = ["completed", "abandoned"] as const;
export const pomodoroOutcomeSchema = z.enum(POMODORO_OUTCOMES);
export type PomodoroOutcome = (typeof POMODORO_OUTCOMES)[number];

export const OUTCOME_LABEL: Record<PomodoroOutcome, string> = {
  completed: "Completed",
  abandoned: "Ended early",
};

export const DEFAULT_POMODORO_CONFIG = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  plannedCycles: 4,
  label: "",
  goalId: null,
  projectId: null,
} as const;

export const pomodoroConfigSchema = z.object({
  workMinutes: z.number().int().min(1).max(180),
  shortBreakMinutes: z.number().int().min(1).max(60),
  longBreakMinutes: z.number().int().min(1).max(120),
  plannedCycles: z.number().int().min(1).max(12),
  label: z.string().trim().max(160),
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
});
export type PomodoroConfig = z.infer<typeof pomodoroConfigSchema>;

/** The blob persisted to `localStorage`. Validated on read — it is a trust boundary. */
export const pomodoroLiveStateSchema = z.object({
  phase: pomodoroPhaseSchema,
  running: z.boolean(),
  phaseEndsAt: z.number().nullable(),
  remainingMs: z.number().nonnegative(),
  cyclesDone: z.number().int().nonnegative(),
  focusMs: z.number().nonnegative(),
  startedAt: isoDateTimeSchema.nullable(),
  config: pomodoroConfigSchema,
});
export type PomodoroLiveState = z.infer<typeof pomodoroLiveStateSchema>;

const pomodoroSessionFieldsSchema = z.object({
  label: z.string().trim().max(160),
  goalId: z.string().trim().min(1).nullable(),
  projectId: z.string().trim().min(1).nullable(),
  outcome: pomodoroOutcomeSchema,
  workMinutes: z.number().int().min(1).max(180),
  shortBreakMinutes: z.number().int().min(1).max(60),
  longBreakMinutes: z.number().int().min(1).max(120),
  plannedCycles: z.number().int().min(1).max(12),
  completedWorkIntervals: z.number().int().nonnegative(),
  focusMinutes: z.number().nonnegative(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  notes: z.string().trim().max(2000),
});

export const pomodoroSessionSchema = defineRecordSchema(pomodoroSessionFieldsSchema.shape);
export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;

export const pomodoroSessionCreateSchema = pomodoroSessionFieldsSchema;
export type PomodoroSessionCreate = z.infer<typeof pomodoroSessionCreateSchema>;

export const pomodoroSessionUpdateSchema = pomodoroSessionFieldsSchema.partial();
export type PomodoroSessionUpdate = z.infer<typeof pomodoroSessionUpdateSchema>;

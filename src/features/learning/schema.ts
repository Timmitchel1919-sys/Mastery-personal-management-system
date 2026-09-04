import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Learning (Layer 11B) — `users/{uid}/learningItems` + `users/{uid}/studySessions`. A
 * learning item is the container for a course, study plan, book-based study, or
 * certification track: an embedded, ordered **lesson checklist** (one-time, toggled
 * directly on the item — unlike the daily-recurring routine steps from Layer 10C),
 * resources, assessment notes, and links up to a goal / life pillar / skill (the last is a
 * bare id for now — Skills ships in Layer 11D). Time spent is tracked separately as
 * **study sessions**, an append-only log analogous to Deep Work sessions (9B), so a
 * learning item's total study time is derived, not duplicated onto the item.
 */

export const LEARNING_ITEM_TYPES = [
  "course",
  "book-study",
  "skill-practice",
  "certification",
  "other",
] as const;
export const learningItemTypeSchema = z.enum(LEARNING_ITEM_TYPES);
export type LearningItemType = (typeof LEARNING_ITEM_TYPES)[number];

export const LEARNING_ITEM_TYPE_LABEL: Record<LearningItemType, string> = {
  course: "Course",
  "book-study": "Book study",
  "skill-practice": "Skill practice",
  certification: "Certification",
  other: "Other",
};

export const LEARNING_STATUSES = ["not-started", "in-progress", "completed", "paused"] as const;
export const learningStatusSchema = z.enum(LEARNING_STATUSES);
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export const LEARNING_STATUS_LABEL: Record<LearningStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
  paused: "Paused",
};

export const MAX_LESSONS = 50;
const learningPillarsSchema = z.array(lifePillarSchema).max(3);

const lessonSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Name the lesson").max(200),
  completed: z.boolean(),
});
export type Lesson = z.infer<typeof lessonSchema>;

const resourceSchema = z.string().trim().min(1).max(300);
const resourcesSchema = z.array(resourceSchema).max(20);

const learningItemFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(200),
  description: z.string().trim().max(2000),
  itemType: learningItemTypeSchema,
  learningStatus: learningStatusSchema,
  provider: z.string().trim().max(120),
  targetCompletionDate: isoDateSchema.nullable(),
  resources: resourcesSchema,
  lessons: z.array(lessonSchema).max(MAX_LESSONS),
  assessmentNotes: z.string().trim().max(2000),
  notes: z.string().trim().max(4000),
  pillarIds: learningPillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
  skillId: z.string().trim().min(1).nullable(),
});

export const learningItemSchema = defineRecordSchema(learningItemFieldsSchema.shape);
export type LearningItem = z.infer<typeof learningItemSchema>;

export const learningItemCreateSchema = learningItemFieldsSchema;
export type LearningItemCreate = z.infer<typeof learningItemCreateSchema>;

export const learningItemUpdateSchema = learningItemFieldsSchema.partial();
export type LearningItemUpdate = z.infer<typeof learningItemUpdateSchema>;

function newLessonId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A fresh lesson for the form's `useFieldArray` — always carries a stable id. */
export function emptyLesson(): { id: string; title: string; completed: boolean } {
  return { id: newLessonId(), title: "", completed: false };
}

/** Completed-vs-total lesson count for a learning item. Pure. */
export function lessonProgress(item: Pick<LearningItem, "lessons">): {
  completed: number;
  total: number;
} {
  return {
    completed: item.lessons.filter((lesson) => lesson.completed).length,
    total: item.lessons.length,
  };
}

// ── Form shape ────────────────────────────────────────────────────────────────
const lessonFormSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Name the lesson").max(200),
  completed: z.boolean(),
});

export const learningItemFormSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(200),
  description: z.string().trim().max(2000),
  itemType: learningItemTypeSchema,
  learningStatus: learningStatusSchema,
  provider: z.string().trim().max(120),
  targetCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
  resourcesText: z.string().trim().max(3000),
  lessons: z.array(lessonFormSchema).max(MAX_LESSONS),
  assessmentNotes: z.string().trim().max(2000),
  notes: z.string().trim().max(4000),
  pillarIds: learningPillarsSchema,
  goalId: z.string(),
});
export type LearningItemFormValues = z.infer<typeof learningItemFormSchema>;

function linesToList(text: string, max: number): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function learningItemInputFromForm(values: LearningItemFormValues): LearningItemCreate {
  return {
    title: values.title,
    description: values.description,
    itemType: values.itemType,
    learningStatus: values.learningStatus,
    provider: values.provider,
    targetCompletionDate: values.targetCompletionDate || null,
    resources: linesToList(values.resourcesText, 20),
    lessons: values.lessons,
    assessmentNotes: values.assessmentNotes,
    notes: values.notes,
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
    skillId: null,
  };
}

// ── Study sessions ────────────────────────────────────────────────────────────
const studySessionFieldsSchema = z.object({
  learningItemId: z.string().trim().min(1).nullable(),
  date: isoDateSchema,
  minutes: z.number().int().min(1).max(600),
  notes: z.string().trim().max(1000),
});

export const studySessionSchema = defineRecordSchema(studySessionFieldsSchema.shape);
export type StudySession = z.infer<typeof studySessionSchema>;

export const studySessionCreateSchema = studySessionFieldsSchema;
export type StudySessionCreate = z.infer<typeof studySessionCreateSchema>;

export const studySessionUpdateSchema = studySessionFieldsSchema.partial();
export type StudySessionUpdate = z.infer<typeof studySessionUpdateSchema>;

export const studySessionFormSchema = z.object({
  learningItemId: z.string(),
  date: isoDateSchema,
  minutes: z.number().int().min(1).max(600),
  notes: z.string().trim().max(1000),
});
export type StudySessionFormValues = z.infer<typeof studySessionFormSchema>;

export function studySessionInputFromForm(values: StudySessionFormValues): StudySessionCreate {
  return {
    learningItemId: values.learningItemId || null,
    date: values.date,
    minutes: values.minutes,
    notes: values.notes,
  };
}

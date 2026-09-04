import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Journal (Layer 11A) — `users/{uid}/journalEntries`. Opens the Grow domain. One entry
 * shape covers free-form writing, guided reflection, daily/weekly reflection, gratitude,
 * lessons learned, and decision journaling — `entryType` mainly drives which prompt the
 * form shows (`JOURNAL_ENTRY_TYPE_PROMPT`) over the shared `content` field; gratitude
 * entries additionally get a short list field. `isPrivate` is a **display-only** flag (the
 * form collapses the entry by default) — Firestore access is already owner-only for every
 * record, and this is not the Recovery Center's privacy gate (Layer 15), which is a
 * separate, more isolated system.
 */

export const JOURNAL_ENTRY_TYPES = [
  "free-form",
  "guided-reflection",
  "daily-reflection",
  "weekly-reflection",
  "gratitude",
  "lessons-learned",
  "decision",
] as const;
export const journalEntryTypeSchema = z.enum(JOURNAL_ENTRY_TYPES);
export type JournalEntryType = (typeof JOURNAL_ENTRY_TYPES)[number];

export const JOURNAL_ENTRY_TYPE_LABEL: Record<JournalEntryType, string> = {
  "free-form": "Free-form",
  "guided-reflection": "Guided reflection",
  "daily-reflection": "Daily reflection",
  "weekly-reflection": "Weekly reflection",
  gratitude: "Gratitude",
  "lessons-learned": "Lessons learned",
  decision: "Decision journal",
};

/** Shown as the content field's placeholder — a starting prompt, not a stored value. */
export const JOURNAL_ENTRY_TYPE_PROMPT: Record<JournalEntryType, string> = {
  "free-form": "Write whatever's on your mind.",
  "guided-reflection": "What's one thing worth reflecting on right now?",
  "daily-reflection":
    "What went well today? What was challenging? What will you carry into tomorrow?",
  "weekly-reflection": "What patterns did you notice this week? What would you do differently?",
  gratitude: "Anything else you want to note about today's gratitude?",
  "lessons-learned": "What happened, and what did it teach you?",
  decision: "What decision are you making, and why?",
};

export const RATING_MIN = 1;
export const RATING_MAX = 5;
const ratingSchema = z.number().int().min(RATING_MIN).max(RATING_MAX);

const gratitudeItemSchema = z.string().trim().min(1).max(200);
const gratitudeItemsSchema = z.array(gratitudeItemSchema).max(10);
const tagSchema = z.string().trim().min(1).max(40);
const tagsSchema = z.array(tagSchema).max(20);
const journalPillarsSchema = z.array(lifePillarSchema).max(3);

const journalEntryFieldsSchema = z.object({
  title: z.string().trim().max(200),
  entryType: journalEntryTypeSchema,
  entryDate: isoDateSchema,
  content: z.string().trim().max(10_000),
  gratitudeItems: gratitudeItemsSchema,
  moodRating: ratingSchema,
  energyLevel: ratingSchema,
  pillarIds: journalPillarsSchema,
  goalId: z.string().trim().min(1).nullable(),
  tags: tagsSchema,
  isPrivate: z.boolean(),
});

const hasSomeContent = (data: { content: string; gratitudeItems: string[] }) =>
  data.content.trim().length > 0 || data.gratitudeItems.length > 0;
const CONTENT_ISSUE = {
  path: ["content"],
  message: "Write something, or add at least one gratitude item",
};

export const journalEntrySchema = defineRecordSchema(journalEntryFieldsSchema.shape);
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export const journalEntryCreateSchema = journalEntryFieldsSchema.refine(
  hasSomeContent,
  CONTENT_ISSUE,
);
export type JournalEntryCreate = z.infer<typeof journalEntryCreateSchema>;

export const journalEntryUpdateSchema = journalEntryFieldsSchema.partial();
export type JournalEntryUpdate = z.infer<typeof journalEntryUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const journalEntryFormSchema = z
  .object({
    title: z.string().trim().max(200),
    entryType: journalEntryTypeSchema,
    entryDate: isoDateSchema,
    content: z.string().trim().max(10_000),
    gratitudeItemsText: z.string().trim().max(2000),
    moodRating: ratingSchema,
    energyLevel: ratingSchema,
    pillarIds: journalPillarsSchema,
    goalId: z.string(),
    tagsText: z.string().trim().max(400),
    isPrivate: z.boolean(),
  })
  .refine((d) => d.content.trim().length > 0 || d.gratitudeItemsText.trim().length > 0, {
    path: ["content"],
    message: "Write something, or add at least one gratitude item",
  });
export type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;

function linesToList(text: string, max: number): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
}

function tagsFromText(text: string): string[] {
  return [
    ...new Set(
      text
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
}

export function journalEntryInputFromForm(values: JournalEntryFormValues): JournalEntryCreate {
  return {
    title: values.title,
    entryType: values.entryType,
    entryDate: values.entryDate,
    content: values.content,
    gratitudeItems:
      values.entryType === "gratitude" ? linesToList(values.gratitudeItemsText, 10) : [],
    moodRating: values.moodRating,
    energyLevel: values.energyLevel,
    pillarIds: values.pillarIds,
    goalId: values.goalId || null,
    tags: tagsFromText(values.tagsText),
    isPrivate: values.isPrivate,
  };
}

import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { isoDateSchema } from "@/lib/validation";
import { lifePillarSchema } from "@/lib/validation/domain";

/**
 * Skills (Layer 11D) — `users/{uid}/skills` + `users/{uid}/skillReviews`. Closes the Grow
 * domain. A skill carries a starting/target proficiency, a category, a practice plan,
 * user-entered evidence and learning resources, and goal/pillar links. **Current
 * proficiency and progress history are derived from the review log**, not stored on the
 * skill — the same "computed, never duplicated" pattern already used for habit streaks
 * (10B) and Deep Work scores (9B): `currentProficiency()` is the latest review's rating,
 * falling back to the skill's `startingProficiency` when it has no reviews yet.
 */

export const SKILL_CATEGORIES = [
  "technical",
  "creative",
  "physical",
  "interpersonal",
  "leadership",
  "language",
  "other",
] as const;
export const skillCategorySchema = z.enum(SKILL_CATEGORIES);
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_CATEGORY_LABEL: Record<SkillCategory, string> = {
  technical: "Technical",
  creative: "Creative",
  physical: "Physical",
  interpersonal: "Interpersonal",
  leadership: "Leadership",
  language: "Language",
  other: "Other",
};

export const PROFICIENCY_MIN = 1;
export const PROFICIENCY_MAX = 5;
const proficiencySchema = z.number().int().min(PROFICIENCY_MIN).max(PROFICIENCY_MAX);

export const MAX_EVIDENCE = 20;
export const MAX_RESOURCES = 20;
const evidenceSchema = z.string().trim().min(1).max(300);
const resourceSchema = z.string().trim().min(1).max(300);
const skillPillarsSchema = z.array(lifePillarSchema).max(3);

const skillFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give the skill a title").max(160),
  description: z.string().trim().max(2000),
  category: skillCategorySchema,
  startingProficiency: proficiencySchema,
  targetProficiency: proficiencySchema,
  practicePlan: z.string().trim().max(2000),
  evidence: z.array(evidenceSchema).max(MAX_EVIDENCE),
  resources: z.array(resourceSchema).max(MAX_RESOURCES),
  goalId: z.string().trim().min(1).nullable(),
  pillarIds: skillPillarsSchema,
  nextReviewDate: isoDateSchema.nullable(),
});

export const skillSchema = defineRecordSchema(skillFieldsSchema.shape);
export type Skill = z.infer<typeof skillSchema>;

export const skillCreateSchema = skillFieldsSchema;
export type SkillCreate = z.infer<typeof skillCreateSchema>;

export const skillUpdateSchema = skillFieldsSchema.partial();
export type SkillUpdate = z.infer<typeof skillUpdateSchema>;

// ── Form shape ────────────────────────────────────────────────────────────────
export const skillFormSchema = z.object({
  title: z.string().trim().min(1, "Give the skill a title").max(160),
  description: z.string().trim().max(2000),
  category: skillCategorySchema,
  startingProficiency: proficiencySchema,
  targetProficiency: proficiencySchema,
  practicePlan: z.string().trim().max(2000),
  evidenceText: z.string().trim().max(3000),
  resourcesText: z.string().trim().max(3000),
  goalId: z.string(),
  pillarIds: skillPillarsSchema,
  nextReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Pick a date"),
});
export type SkillFormValues = z.infer<typeof skillFormSchema>;

function linesToList(text: string, max: number): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function skillInputFromForm(values: SkillFormValues): SkillCreate {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    startingProficiency: values.startingProficiency,
    targetProficiency: values.targetProficiency,
    practicePlan: values.practicePlan,
    evidence: linesToList(values.evidenceText, MAX_EVIDENCE),
    resources: linesToList(values.resourcesText, MAX_RESOURCES),
    goalId: values.goalId || null,
    pillarIds: values.pillarIds,
    nextReviewDate: values.nextReviewDate || null,
  };
}

// ── Skill reviews (progress history) ────────────────────────────────────────────
const skillReviewFieldsSchema = z.object({
  skillId: z.string().trim().min(1),
  date: isoDateSchema,
  proficiency: proficiencySchema,
  notes: z.string().trim().max(1000),
});

export const skillReviewSchema = defineRecordSchema(skillReviewFieldsSchema.shape);
export type SkillReview = z.infer<typeof skillReviewSchema>;

export const skillReviewCreateSchema = skillReviewFieldsSchema;
export type SkillReviewCreate = z.infer<typeof skillReviewCreateSchema>;

export const skillReviewUpdateSchema = skillReviewFieldsSchema.partial();
export type SkillReviewUpdate = z.infer<typeof skillReviewUpdateSchema>;

export const skillReviewFormSchema = z.object({
  date: isoDateSchema,
  proficiency: proficiencySchema,
  notes: z.string().trim().max(1000),
});
export type SkillReviewFormValues = z.infer<typeof skillReviewFormSchema>;

export function skillReviewInputFromForm(
  skillId: string,
  values: SkillReviewFormValues,
): SkillReviewCreate {
  return { skillId, date: values.date, proficiency: values.proficiency, notes: values.notes };
}

/** The latest review's rating, or the skill's starting proficiency with no reviews. Pure. */
export function currentProficiency(
  skill: Pick<Skill, "startingProficiency">,
  reviews: Pick<SkillReview, "date" | "proficiency">[],
): number {
  if (reviews.length === 0) return skill.startingProficiency;
  const latest = [...reviews].sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest?.proficiency ?? skill.startingProficiency;
}

/** 0–100 progress from the proficiency floor to the skill's target. Pure. */
export function progressToTarget(
  skill: Pick<Skill, "startingProficiency" | "targetProficiency">,
  reviews: Pick<SkillReview, "date" | "proficiency">[],
): number {
  const current = currentProficiency(skill, reviews);
  if (skill.targetProficiency <= PROFICIENCY_MIN) return 100;
  const percent = (current / skill.targetProficiency) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

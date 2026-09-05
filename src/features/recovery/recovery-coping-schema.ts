import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";

/**
 * Coping toolkit (Layer 15D) — `users/{uid}/recoveryGoals/{goalId}/copingActions/{id}`.
 * A per-goal list of coping actions the user keeps ready to reach for during an urge:
 * evidence-informed behavioral techniques plus, when the goal opts in, faith-based
 * options (`docs/RECOVERY_PRIVACY.md` §4). Client-written under the generic owner-only
 * rule — a coping action is a plain reference note, not one of the Cloud-Function-mediated
 * setback records in §3. Language stays neutral and encouraging.
 */

export const COPING_CATEGORIES = [
  "grounding",
  "physical",
  "social",
  "cognitive",
  "faith",
  "other",
] as const;
export const copingCategorySchema = z.enum(COPING_CATEGORIES);
export type CopingCategory = (typeof COPING_CATEGORIES)[number];

export const COPING_CATEGORY_LABEL: Record<CopingCategory, string> = {
  grounding: "Grounding",
  physical: "Physical",
  social: "Reach out",
  cognitive: "Reframe",
  faith: "Faith",
  other: "Other",
};

const copingActionFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give it a short name").max(160),
  category: copingCategorySchema,
  howTo: z.string().trim().max(1000),
});

export const recoveryCopingActionSchema = defineRecordSchema(copingActionFieldsSchema.shape);
export type RecoveryCopingAction = z.infer<typeof recoveryCopingActionSchema>;

export const recoveryCopingActionCreateSchema = copingActionFieldsSchema;
export type RecoveryCopingActionCreate = z.infer<typeof recoveryCopingActionCreateSchema>;

export const recoveryCopingActionUpdateSchema = copingActionFieldsSchema.partial();
export type RecoveryCopingActionUpdate = z.infer<typeof recoveryCopingActionUpdateSchema>;

export const recoveryCopingActionFormSchema = copingActionFieldsSchema;
export type RecoveryCopingActionFormValues = z.infer<typeof recoveryCopingActionFormSchema>;

/**
 * A small starter library the user can add with one tap. `faith` entries are only offered
 * when the goal has `faithBasedEncouragement` enabled. These are prompts, not clinical
 * advice — the module never diagnoses or claims to replace a professional.
 */
export interface CopingSuggestion {
  title: string;
  category: CopingCategory;
  howTo: string;
}

export const COPING_SUGGESTIONS: readonly CopingSuggestion[] = [
  {
    title: "Urge surfing",
    category: "grounding",
    howTo:
      "Notice the urge rise, peak, and fall like a wave. Watch it without acting for a few minutes — it passes.",
  },
  {
    title: "5-4-3-2-1 grounding",
    category: "grounding",
    howTo: "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.",
  },
  {
    title: "Box breathing",
    category: "physical",
    howTo: "Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat four rounds.",
  },
  {
    title: "Move your body",
    category: "physical",
    howTo: "Stand up and do two minutes of anything — a short walk, stretches, the stairs.",
  },
  {
    title: "10-minute delay",
    category: "cognitive",
    howTo:
      "Tell yourself you can decide in 10 minutes. Set a timer and do one other thing until it rings.",
  },
  {
    title: "Replacement activity",
    category: "cognitive",
    howTo: "Pick one small, ready alternative you can start straight away instead.",
  },
  {
    title: "Message a support person",
    category: "social",
    howTo: "Send one honest line to someone who knows what you're working on.",
  },
  {
    title: "Self-compassion pause",
    category: "cognitive",
    howTo:
      "Say to yourself what you'd say to a friend in this moment. This is hard, and you're still trying.",
  },
  {
    title: "Prayer or stillness",
    category: "faith",
    howTo: "Take a few quiet minutes for prayer or reflection before deciding what to do next.",
  },
  {
    title: "Scripture or reflection reading",
    category: "faith",
    howTo: "Read a short passage that steadies you and sit with it for a moment.",
  },
  {
    title: "Gratitude list",
    category: "faith",
    howTo: "Write down three things you're thankful for right now, however small.",
  },
] as const;

export function copingInputFromSuggestion(
  suggestion: CopingSuggestion,
): RecoveryCopingActionCreate {
  return {
    title: suggestion.title,
    category: suggestion.category,
    howTo: suggestion.howTo,
  };
}

import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";

/**
 * AI Coach (Layer 13) — client side of `functions/src/ai/**`. All AI runs server-side in
 * authenticated Cloud Functions (see `docs/AI_ARCHITECTURE.md`); this feature only calls
 * those callables and reads back the resulting `users/{uid}/coachExchanges` history — it
 * never talks to an AI provider directly and holds no provider key.
 */

export const AI_INTENTS = [
  "coach-query",
  "planning-recommendations",
  "goal-breakdown",
  "reflection-questions",
  "execution-patterns",
] as const;
export const aiIntentSchema = z.enum(AI_INTENTS);
export type AiIntent = (typeof AI_INTENTS)[number];

export const AI_INTENT_LABEL: Record<AiIntent, string> = {
  "coach-query": "Ask a question",
  "planning-recommendations": "Planning recommendations",
  "goal-breakdown": "Break down a goal",
  "reflection-questions": "Reflection questions",
  "execution-patterns": "Execution patterns",
};

const contextRefSchema = z.object({
  collection: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
});
export type ContextRef = z.infer<typeof contextRefSchema>;

const coachActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
});
export type CoachAction = z.infer<typeof coachActionSchema>;

const targetRefSchema = z.object({ collection: z.string().min(1), id: z.string().min(1) });
export type TargetRef = z.infer<typeof targetRefSchema>;

/** What a callable returns — mirrors `functions/src/ai/shared/contracts.ts` `aiResponseSchema`
 * plus the two fields the callable adds for the client's convenience. */
export const coachCallResultSchema = z.object({
  answer: z.string().min(1),
  assumptions: z.array(z.string()),
  suggestedActions: z.array(coachActionSchema),
  disclaimers: z.array(z.string()),
  influencedBy: z.array(contextRefSchema),
  exchangeId: z.string().min(1),
  createdAt: z.string(),
});
export type CoachCallResult = z.infer<typeof coachCallResultSchema>;

const coachExchangeFieldsSchema = z.object({
  intent: aiIntentSchema,
  targetRef: targetRefSchema.nullable(),
  userMessage: z.string().nullable(),
  answer: z.string(),
  assumptions: z.array(z.string()),
  suggestedActions: z.array(coachActionSchema),
  disclaimers: z.array(z.string()),
  influencedBy: z.array(contextRefSchema),
});

/** The persisted record read back for the coach's history — written by the Cloud Function. */
export const coachExchangeSchema = defineRecordSchema(coachExchangeFieldsSchema.shape);
export type CoachExchange = z.infer<typeof coachExchangeSchema>;

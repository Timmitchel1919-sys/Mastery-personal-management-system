import { z } from "zod";

/**
 * The request/response contract for every general-AI endpoint (Layer 13), per
 * `docs/AI_ARCHITECTURE.md` §4. `influencedBy` is never produced by the model — the
 * handler always attaches exactly the context it built server-side, so the client can
 * trust it and the model can never hallucinate a reference to a record that wasn't
 * actually used.
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

export const contextRefSchema = z.object({
  collection: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
});
export type ContextRef = z.infer<typeof contextRefSchema>;

export const actionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
});
export type Action = z.infer<typeof actionSchema>;

const targetRefSchema = z.object({ collection: z.string().min(1), id: z.string().min(1) });
export type TargetRef = z.infer<typeof targetRefSchema>;

export const aiRequestSchema = z.object({
  intent: aiIntentSchema,
  targetRef: targetRefSchema.nullable().default(null),
  userMessage: z.string().trim().min(1).max(4000).nullable().default(null),
  options: z
    .object({ includePrivateJournal: z.boolean().default(false) })
    .default({ includePrivateJournal: false }),
});
export type AiRequest = z.infer<typeof aiRequestSchema>;

/** What the model itself must produce — validated before anything else touches it. */
export const modelOutputSchema = z.object({
  answer: z.string().trim().min(1).max(8000),
  assumptions: z.array(z.string().trim().min(1)).max(20),
  suggestedActions: z.array(actionSchema).max(20),
  disclaimers: z.array(z.string().trim().min(1)).max(10).default([]),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;

/** The full client-facing contract: model output plus the server-attached context refs. */
export const aiResponseSchema = modelOutputSchema.extend({
  influencedBy: z.array(contextRefSchema).max(50),
});
export type AiResponse = z.infer<typeof aiResponseSchema>;

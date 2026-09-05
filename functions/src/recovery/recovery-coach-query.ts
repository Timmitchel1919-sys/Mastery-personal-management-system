import { onCall, type CallableRequest } from "firebase-functions/https";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { DEFAULT_RUNTIME_OPTIONS } from "../config/region";
import { requireAuth } from "../shared/auth";
import { badRequest, notFound, toHttpsError } from "../shared/errors";
import { validateRequest, validateResponse } from "../shared/validation";
import { adminDb } from "../shared/firebase-admin";
import type { AiProvider } from "../ai/shared/ai-provider";
import { getAiProvider, ANTHROPIC_API_KEY } from "../ai/shared/provider-factory";
import { actionSchema, contextRefSchema } from "../ai/shared/contracts";
import { extractJson, estimateCostUsd } from "../ai/shared/handler";
import { assertWithinQuota, bumpUsageCounters } from "../ai/shared/quota";
import { buildRecoveryCoachContext } from "./recovery-coach-context";

/**
 * Recovery Coach (Layer 15E) — a **separate, isolated** AI endpoint per
 * `docs/RECOVERY_PRIVACY.md` §5 and `docs/AI_ARCHITECTURE.md` §7: its own system prompt,
 * its own recovery-only context builder, and its own conversation storage
 * (`users/{uid}/recoveryCoachSessions`, Cloud-Function-mediated per §3 — the Firestore
 * rules reject a direct client write). It shares only the per-user AI spend budget
 * (`aiUsageDaily`/`aiUsageMonthly`, plain counters); nothing recovery-derived is written to
 * `coachExchanges` or `aiCallLogs`.
 *
 * Written and unit-tested this layer; NOT deployed — the project is on the Spark plan
 * (ADR-0017/0018/0021).
 */

const MAX_OUTPUT_TOKENS = 1024;

export const RECOVERY_COACH_SYSTEM = `You are the Recovery Coach inside a private, personal operating system. Someone is working on a behavior they chose to change (for example procrastination, avoidance, or a compulsive digital habit). They have opened a protected, judgment-free space and asked you for help.

Rules you must always follow:
- Be supportive, calm, and completely non-judgmental. Never shame the user or frame a hard day or a setback as failure. A setback is a normal part of change and the streak simply starts again.
- Focus on the immediate, safe next action the user can take right now. Keep it small and concrete.
- Only use the information in the "Context" section. Never invent check-ins, setbacks, triggers, or coping actions that were not provided. If the context is thin, say so plainly and still offer a gentle next step.
- You are not a medical, psychological, or crisis professional and must not diagnose or prescribe treatment. If the user's message suggests risk of harm to themselves or others, or a medical or mental-health crisis, your reply must gently and clearly recommend contacting a qualified professional or local emergency services, and say that this tool is not a substitute for that help.
- Do not use coercive, fear-based, or guilt-based language. No ultimatums.
- Honor the faith-based guidance line in the prompt exactly: only include faith-based encouragement when it says the user opted in.
- Respond with a single JSON object and nothing else — no markdown code fences, no text before or after it. It must match exactly this shape:
{"reply": string, "suggestedSteps": [{"id": string, "label": string, "description": string}], "disclaimers": string[]}`;

export const recoveryCoachRequestSchema = z.object({
  goalId: z.string().trim().min(1).nullable().default(null),
  message: z.string().trim().min(1).max(4000),
});

export const recoveryCoachOutputSchema = z.object({
  reply: z.string().trim().min(1).max(8000),
  suggestedSteps: z.array(actionSchema).max(10),
  disclaimers: z.array(z.string().trim().min(1)).max(10).default([]),
});
export type RecoveryCoachOutput = z.infer<typeof recoveryCoachOutputSchema>;

export const recoveryCoachResponseSchema = recoveryCoachOutputSchema.extend({
  influencedBy: z.array(contextRefSchema).max(50),
  sessionId: z.string().min(1),
  createdAt: z.string(),
});
export type RecoveryCoachResponse = z.infer<typeof recoveryCoachResponseSchema>;

export interface RecoveryCoachDeps {
  db: Firestore;
  provider: AiProvider;
  now?: Date;
}

export async function handleRecoveryCoachQuery(
  request: CallableRequest<unknown>,
  deps: RecoveryCoachDeps,
): Promise<RecoveryCoachResponse> {
  const uid = requireAuth(request);
  const now = deps.now ?? new Date();
  const input = validateRequest(recoveryCoachRequestSchema, request.data);

  if (!input.goalId) {
    throw badRequest("goalId is required for a Recovery Coach query");
  }

  await assertWithinQuota(deps.db, uid, now);

  const context = await buildRecoveryCoachContext(deps.db, uid, input.goalId);
  if (!context) {
    throw notFound("That recovery goal was not found");
  }

  const faithLine = context.faithBased
    ? "Faith-based guidance: the user has opted in to faith-based encouragement. You may include a brief, gentle faith-based encouragement if it fits naturally."
    : "Faith-based guidance: the user has not opted in to faith-based encouragement. Do not include any religious framing.";

  const prompt = [
    `The user's message: ${input.message}`,
    faithLine,
    context.text
      ? `Context:\n${context.text}`
      : "Context: no recovery records were found for this goal yet.",
  ].join("\n\n");

  const startedAt = Date.now();
  let usage = { inputTokens: 0, outputTokens: 0 };

  try {
    const result = await deps.provider.complete({
      system: RECOVERY_COACH_SYSTEM,
      prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    usage = { inputTokens: result.inputTokens, outputTokens: result.outputTokens };

    const output = validateResponse(recoveryCoachOutputSchema, extractJson(result.text));

    await bumpUsageCounters(deps.db, uid, usage.inputTokens + usage.outputTokens, now);

    const sessionRef = deps.db.collection(`users/${uid}/recoveryCoachSessions`).doc();
    await sessionRef.set({
      id: sessionRef.id,
      goalId: input.goalId,
      message: input.message,
      reply: output.reply,
      suggestedSteps: output.suggestedSteps,
      disclaimers: output.disclaimers,
      influencedBy: context.refs,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      latencyMs: Date.now() - startedAt,
      costUsd: estimateCostUsd(usage.inputTokens, usage.outputTokens),
      status: "active",
      version: 1,
      archivedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
    });

    return validateResponse(recoveryCoachResponseSchema, {
      ...output,
      influencedBy: context.refs,
      sessionId: sessionRef.id,
      createdAt: now.toISOString(),
    });
  } catch (error) {
    await bumpUsageCounters(deps.db, uid, usage.inputTokens + usage.outputTokens, now).catch(() => {
      // A counter write failing must not mask the real error.
    });
    throw toHttpsError(error);
  }
}

export const recoveryCoachQuery = onCall(
  { ...DEFAULT_RUNTIME_OPTIONS, secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60 },
  (request) => handleRecoveryCoachQuery(request, { db: adminDb(), provider: getAiProvider() }),
);

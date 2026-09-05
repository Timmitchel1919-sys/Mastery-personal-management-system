import type { CallableRequest } from "firebase-functions/https";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "../../shared/auth";
import { badRequest, toHttpsError } from "../../shared/errors";
import { validateRequest, validateResponse } from "../../shared/validation";
import type { AiProvider } from "./ai-provider";
import { buildContext } from "./context-builder";
import { aiRequestSchema, modelOutputSchema, type AiIntent, type AiResponse } from "./contracts";
import { INTENT_INSTRUCTIONS, SYSTEM_PREAMBLE } from "./prompts";
import { assertWithinQuota, recordUsage } from "./quota";

const MAX_OUTPUT_TOKENS = 1024;

// Rough per-token cost estimate for the configured model — for the internal spend
// ceiling only, not a substitute for the provider's own billing dashboard.
const COST_PER_INPUT_TOKEN_USD = 3 / 1_000_000;
const COST_PER_OUTPUT_TOKEN_USD = 15 / 1_000_000;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * COST_PER_INPUT_TOKEN_USD + outputTokens * COST_PER_OUTPUT_TOKEN_USD;
}

/** Pull the JSON object out of a model reply, tolerating a markdown code fence around it. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = (fenced ? fenced[1] : text)?.trim();
  if (!candidate) {
    throw new Error("The model returned an empty reply");
  }
  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("The model did not return valid JSON");
  }
}

export interface AiHandlerDeps {
  db: Firestore;
  provider: AiProvider;
  /** Injectable for tests; defaults to the real time. */
  now?: Date;
}

/**
 * The shared flow behind every AI endpoint (Layer 13): authenticate, validate, enforce
 * quota, build minimal context, call the provider, validate its structured output, record
 * usage, persist the exchange, and return the documented response contract.
 */
export async function handleAiIntent(
  intent: AiIntent,
  request: CallableRequest<unknown>,
  deps: AiHandlerDeps,
): Promise<AiResponse & { exchangeId: string; createdAt: string }> {
  const uid = requireAuth(request);
  const now = deps.now ?? new Date();
  const input = validateRequest(aiRequestSchema, { ...(request.data as object), intent });

  if (intent === "coach-query" && !input.userMessage) {
    throw badRequest("userMessage is required for a coach query");
  }
  if (intent === "goal-breakdown" && !input.targetRef) {
    throw badRequest("targetRef is required for a goal breakdown");
  }

  await assertWithinQuota(deps.db, uid, now);

  const context = await buildContext(
    deps.db,
    uid,
    intent,
    input.targetRef,
    input.options.includePrivateJournal,
  );
  const promptParts = [
    INTENT_INSTRUCTIONS[intent],
    input.userMessage ? `User message: ${input.userMessage}` : null,
    context.text ? `Context:\n${context.text}` : "Context: no relevant records were found.",
  ].filter((part): part is string => Boolean(part));

  const startedAt = Date.now();
  let usage = { inputTokens: 0, outputTokens: 0 };

  try {
    const result = await deps.provider.complete({
      system: SYSTEM_PREAMBLE,
      prompt: promptParts.join("\n\n"),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    usage = { inputTokens: result.inputTokens, outputTokens: result.outputTokens };

    const modelOutput = validateResponse(modelOutputSchema, extractJson(result.text));
    const response: AiResponse = { ...modelOutput, influencedBy: context.refs };

    await recordUsage(
      deps.db,
      uid,
      {
        intent,
        ...usage,
        latencyMs: Date.now() - startedAt,
        outcome: "success",
        costUsd: estimateCostUsd(usage.inputTokens, usage.outputTokens),
      },
      now,
    );

    const exchangeRef = deps.db.collection(`users/${uid}/coachExchanges`).doc();
    await exchangeRef.set({
      id: exchangeRef.id,
      intent,
      targetRef: input.targetRef,
      userMessage: input.userMessage,
      answer: response.answer,
      assumptions: response.assumptions,
      suggestedActions: response.suggestedActions,
      disclaimers: response.disclaimers,
      influencedBy: response.influencedBy,
      status: "active",
      version: 1,
      archivedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
    });

    return { ...response, exchangeId: exchangeRef.id, createdAt: now.toISOString() };
  } catch (error) {
    await recordUsage(
      deps.db,
      uid,
      {
        intent,
        ...usage,
        latencyMs: Date.now() - startedAt,
        outcome: "error",
        costUsd: estimateCostUsd(usage.inputTokens, usage.outputTokens),
      },
      now,
    ).catch(() => {
      // Never let a logging failure mask the real error below.
    });
    throw toHttpsError(error);
  }
}

import type { CallableRequest } from "firebase-functions/https";
import type { Firestore } from "firebase-admin/firestore";
import { requireAuth } from "../../shared/auth";
import { toHttpsError } from "../../shared/errors";
import { validateRequest, validateResponse } from "../../shared/validation";
import type { AiProvider } from "../shared/ai-provider";
import { bumpUsageCounters } from "../shared/quota";
import {
  aiPersonalInsightRequestSchema,
  aiPersonalInsightResponseSchema,
  modelPersonalInsightSchema,
  type AiPersonalInsightRequest,
  type AiPersonalInsightResponse,
} from "./contracts";

const MAX_OUTPUT_TOKENS = 700;

const SYSTEM_PROMPT = `You are the MASTERY Personal Insight assistant.

Rules:
- Use only the supplied deterministic context.
- Never invent new facts, numbers, goals, tasks, dates, or history.
- Separate factual summary from interpretation and recommendations.
- If context is limited, include that in limitations.
- Return a single JSON object only with keys:
  summary, interpretation, recommendations, limitations, factRefs.
- factRefs must contain indexes that refer only to the provided facts array.`;

function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = (fenced ? fenced[1] : text)?.trim();
  if (!candidate) throw new Error("The model returned an empty reply");
  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("The model did not return valid JSON");
  }
}

function availableNumberTokens(request: AiPersonalInsightRequest): Set<string> {
  const bag = [
    request.title,
    request.deterministicSummary,
    request.deterministicRecommendation,
    ...request.facts.map((fact) => `${fact.label} ${fact.value}`),
    ...request.limitations,
  ].join(" ");
  const numbers = bag.match(/\d+(?:\.\d+)?/g) ?? [];
  return new Set(numbers);
}

function referencedNumberTokens(response: AiPersonalInsightResponse): string[] {
  const text = [
    response.summary,
    response.interpretation,
    ...response.recommendations,
    ...response.limitations,
  ].join(" ");
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

function assertNumericGrounding(
  request: AiPersonalInsightRequest,
  response: AiPersonalInsightResponse,
): void {
  const supported = availableNumberTokens(request);
  const referenced = referencedNumberTokens(response);
  const unsupported = referenced.filter((token) => !supported.has(token));
  if (unsupported.length > 0) {
    throw new Error(`AI response referenced unsupported numeric values: ${unsupported.join(", ")}`);
  }
}

function composePrompt(input: AiPersonalInsightRequest): string {
  const facts = input.facts.map((fact, index) => `${index}. ${fact.label}: ${fact.value}`).join("\n");
  const limitations =
    input.limitations.length > 0
      ? input.limitations.map((item) => `- ${item}`).join("\n")
      : "- No known deterministic limitations for this request.";

  return [
    `Category: ${input.category}`,
    `Module: ${input.moduleId ?? "global"}`,
    `Title: ${input.title}`,
    `Deterministic summary: ${input.deterministicSummary}`,
    `Deterministic recommendation: ${input.deterministicRecommendation}`,
    `Facts:\n${facts}`,
    `Known limitations:\n${limitations}`,
    `Source insight ids: ${input.sourceInsightIds.join(", ")}`,
  ].join("\n\n");
}

export interface PersonalInsightDeps {
  db: Firestore;
  provider: AiProvider;
  now?: Date;
}

export async function handleGeneratePersonalInsight(
  request: CallableRequest<unknown>,
  deps: PersonalInsightDeps,
): Promise<AiPersonalInsightResponse> {
  const uid = requireAuth(request);
  const now = deps.now ?? new Date();
  const input = validateRequest(aiPersonalInsightRequestSchema, request.data);

  try {
    const completion = await deps.provider.complete({
      system: SYSTEM_PROMPT,
      prompt: composePrompt(input),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    const rawModel = validateResponse(modelPersonalInsightSchema, extractJson(completion.text));
    const facts = Array.from(new Set(rawModel.factRefs))
      .map((index) => input.facts[index])
      .filter((fact): fact is (typeof input.facts)[number] => Boolean(fact));

    if (facts.length === 0 || facts.length !== new Set(rawModel.factRefs).size) {
      throw new Error("AI insight cited unsupported facts");
    }

    const output = validateResponse(aiPersonalInsightResponseSchema, {
      summary: rawModel.summary,
      facts,
      interpretation: rawModel.interpretation,
      recommendations: rawModel.recommendations,
      limitations: rawModel.limitations,
    });

    assertNumericGrounding(input, output);

    await bumpUsageCounters(deps.db, uid, completion.inputTokens + completion.outputTokens, now);

    return output;
  } catch (error) {
    throw toHttpsError(error);
  }
}

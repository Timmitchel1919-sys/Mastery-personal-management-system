"use client";

import { useCallback, useMemo, useState } from "react";
import type { BrainModuleId } from "@/features/brain-hub";
import type { MasteryInsight } from "./mastery-intelligence";
import {
  buildAiInsightCacheKey,
  buildAiPersonalInsightContext,
  hasSufficientDataForAi,
} from "./ai-personal-insight-context";
import { generateAiPersonalInsight } from "./ai-personal-insight-client";
import type { AiPersonalInsightResponse } from "./ai-personal-insight-schema";

type AiInsightStatus = "idle" | "loading" | "ready" | "error";

const CACHE_KEY = "mastery.intelligence.ai.cache";

interface CacheShape {
  [cacheKey: string]: AiPersonalInsightResponse;
}

function readCache(): CacheShape {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as CacheShape) : {};
  } catch {
    return {};
  }
}

function writeCache(data: CacheShape): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // cache is optional convenience only
  }
}

export interface UseAiPersonalInsightOptions {
  moduleId?: BrainModuleId;
  insights: MasteryInsight[];
  attentionCount: number;
  recommendationCount: number;
}

export function useAiPersonalInsight(options: UseAiPersonalInsightOptions) {
  const [status, setStatus] = useState<AiInsightStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AiPersonalInsightResponse | null>(null);

  const context = useMemo(
    () =>
      buildAiPersonalInsightContext({
        moduleId: options.moduleId,
        insights: options.insights,
        attentionCount: options.attentionCount,
        recommendationCount: options.recommendationCount,
      }),
    [options.moduleId, options.insights, options.attentionCount, options.recommendationCount],
  );

  const canGenerate = hasSufficientDataForAi({
    moduleId: options.moduleId,
    insights: options.insights,
    attentionCount: options.attentionCount,
    recommendationCount: options.recommendationCount,
  });

  const generate = useCallback(async () => {
    if (!context) return;

    const cacheKey = buildAiInsightCacheKey(options.moduleId, context.sourceInsightIds);
    const cache = readCache();
    if (cache[cacheKey]) {
      setStatus("ready");
      setError(null);
      setResponse(cache[cacheKey]);
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const next = await generateAiPersonalInsight(context);
      cache[cacheKey] = next;
      writeCache(cache);
      setResponse(next);
      setStatus("ready");
    } catch (nextError) {
      setStatus("error");
      setResponse(null);
      setError(nextError instanceof Error ? nextError.message : "AI insight temporarily unavailable.");
    }
  }, [context, options.moduleId]);

  return {
    status,
    error,
    response,
    context,
    canGenerate,
    generate,
  };
}

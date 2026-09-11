"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDecisions } from "@/features/decisions";
import { useGoals } from "@/features/goals";
import { useJournal } from "@/features/journal";
import { listActivePlans } from "@/features/plans/repositories";
import type { Plan, PlanHorizon } from "@/features/plans/schema";
import { useTasks } from "@/features/tasks";
import {
  assembleAiContext,
  buildContextIndex,
  deriveRelationships,
  detectContextConflicts,
  queryContext,
  type AiContextRequest,
  type ContextConflict,
  type ContextItem,
  type ContextQuery,
  type ContextQueryResult,
  type ContextRelationship,
  type ContextSources,
} from "./context-model";
import { useUserContext } from "./user-context-store";

const HORIZONS: PlanHorizon[] = ["five-year", "one-year", "quarter", "month", "week"];
const REFRESH_MS = 180_000;

/**
 * Layer P — the context hook.
 *
 * Composes the existing domain hooks the signed-in user already loads, folds them
 * into the reference index, and exposes deterministic query / conflict / AI
 * assembly. It adds one batched plan read; everything else is reused. No data
 * leaves the device except through `assembleForAi`, which is capped to the
 * minimum necessary.
 */
export function useKnowledgeContext() {
  const goals = useGoals();
  const tasks = useTasks();
  const journal = useJournal();
  const { decisions } = useDecisions();
  const userContext = useUserContext();

  const [plans, setPlans] = useState<Plan[] | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const pages = await Promise.all(HORIZONS.map((horizon) => listActivePlans(horizon)));
      setPlans(pages.flat());
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void loadPlans(), 0);
    const timer = setInterval(() => void loadPlans(), REFRESH_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadPlans]);

  const sources = useMemo<ContextSources>(
    () => ({
      goals: goals.items,
      plans: plans ?? [],
      tasks: tasks.items,
      decisions,
      journal: journal.items,
      explicitNotes: userContext.notes,
      irrelevantSourceIds: userContext.irrelevantSourceIds,
    }),
    [goals.items, plans, tasks.items, decisions, journal.items, userContext.notes, userContext.irrelevantSourceIds],
  );

  const index = useMemo(() => buildContextIndex(sources), [sources]);
  const relationships = useMemo<ContextRelationship[]>(() => deriveRelationships(index), [index]);
  const conflicts = useMemo<ContextConflict[]>(
    () => detectContextConflicts(sources, index),
    [sources, index],
  );

  const query = useCallback(
    (q: ContextQuery): ContextQueryResult[] => queryContext(index, relationships, q),
    [index, relationships],
  );

  const assembleForAi = useCallback(
    (request: AiContextRequest, options?: { maxItems?: number; maxChars?: number }) =>
      assembleAiContext(index, relationships, request, options),
    [index, relationships],
  );

  const status =
    goals.status === "loading" && plans === null && tasks.status === "loading" ? "loading" : "ready";

  const reload = () => {
    goals.reload();
    tasks.reload();
    journal.reload();
    void loadPlans();
  };

  return {
    status,
    index,
    relationships,
    conflicts,
    query,
    assembleForAi,
    userContext,
    reload,
  };
}

export type { ContextItem, ContextQuery, ContextQueryResult };

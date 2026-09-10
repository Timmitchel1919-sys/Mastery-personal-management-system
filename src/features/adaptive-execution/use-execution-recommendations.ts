"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { goalRepository } from "@/features/goals/goal-repository";
import { listActivePlans } from "@/features/plans/repositories";
import { taskRepository, listActiveTasks } from "@/features/tasks/task-repository";
import type { TaskUpdate } from "@/features/tasks/schema";
import type { GoalUpdate } from "@/features/goals/schema";
import { buildExecutionRecommendations, type ExecutionRecommendation } from "./execution-recommendation";

export type ExecutionDraft = {
  title?: string;
  description?: string;
  suggestedAction?: string;
  priority?: "low" | "medium" | "high" | "critical";
};

function useSafeAuthStatus() {
  try {
    return useAuth().status;
  } catch {
    return "unauthenticated" as const;
  }
}

export function useExecutionRecommendations() {
  const authStatus = useSafeAuthStatus();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ExecutionRecommendation[]>([]);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setStatus("loading");
      return;
    }

    try {
      const [loadedGoals, weekPlans, monthPlans, loadedTasks] = await Promise.all([
        (await import("@/features/goals/goal-repository")).listActiveGoals(),
        listActivePlans("week"),
        listActivePlans("month"),
        listActiveTasks(240),
      ]);

      const allPlans = [...weekPlans, ...monthPlans];
      setRecommendations(buildExecutionRecommendations({ goals: loadedGoals, plans: allPlans, tasks: loadedTasks }));
      setStatus("ready");
      setError(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load execution recommendations.";
      setStatus("error");
      setError(message);
    }
  }, [authStatus]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (authStatus !== "authenticated") {
        return;
      }

      try {
        const [loadedGoals, weekPlans, monthPlans, loadedTasks] = await Promise.all([
          (await import("@/features/goals/goal-repository")).listActiveGoals(),
          listActivePlans("week"),
          listActivePlans("month"),
          listActiveTasks(240),
        ]);

        if (cancelled) {
          return;
        }

        const allPlans = [...weekPlans, ...monthPlans];
        setRecommendations(buildExecutionRecommendations({ goals: loadedGoals, plans: allPlans, tasks: loadedTasks }));
        setStatus("ready");
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message = caught instanceof Error ? caught.message : "Unable to load execution recommendations.";
        setStatus("error");
        setError(message);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  const dismiss = useCallback((id: string) => {
    setRecommendations((current) => current.filter((item) => item.id !== id));
  }, []);

  const approve = useCallback(
    async (id: string, draft: ExecutionDraft = {}) => {
      const recommendation = recommendations.find((item) => item.id === id);
      if (!recommendation) {
        return;
      }

      setError(null);

      try {
        if (recommendation.relatedEntity?.type === "task") {
          const current = await taskRepository.get(recommendation.relatedEntity.id);
          if (!current || current.status === "archived") {
            throw new Error("Recommendation is no longer applicable.");
          }

          const patch: TaskUpdate = {
            taskStatus: current.taskStatus === "blocked" ? "in-progress" : "in-progress",
            priority: draft.priority ?? current.priority,
          };

          await taskRepository.update(recommendation.relatedEntity.id, patch);
        }

        if (recommendation.relatedEntity?.type === "goal") {
          const current = await goalRepository.get(recommendation.relatedEntity.id);
          if (!current || current.status === "archived") {
            throw new Error("Recommendation is no longer applicable.");
          }

          const patch: GoalUpdate = {
            goalStatus: current.goalStatus === "not-started" ? "in-progress" : current.goalStatus,
          };

          await goalRepository.update(recommendation.relatedEntity.id, patch);
        }

        setRecommendations((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  title: draft.title?.trim() || item.title,
                  description: draft.description?.trim() || item.description,
                  suggestedAction: draft.suggestedAction?.trim() || item.suggestedAction,
                  status: "APPROVED",
                }
              : item,
          ),
        );
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Failed to approve the recommendation.";
        setError(message);
      }
    },
    [recommendations],
  );

  const executionSummary = useMemo(() => {
    const next = recommendations.slice(0, 3);
    return { available: next.length > 0, items: next };
  }, [recommendations]);

  return {
    status,
    error,
    items: executionSummary.items,
    available: executionSummary.available,
    dismiss,
    approve,
    reload: refresh,
  };
}

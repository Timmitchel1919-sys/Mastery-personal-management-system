"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { PLAN_HORIZONS, listActivePlans, type Plan, type PlanHorizon } from "@/features/plans";
import { listActiveGoals, type Goal } from "@/features/goals";
import { listActiveProjects, type Project } from "@/features/projects";
import { listActiveMilestones, type Milestone } from "@/features/milestones";
import { listActiveRoadmaps, type Roadmap } from "@/features/roadmaps";
import { buildCascade, type Cascade } from "./build-cascade";

type Status = "loading" | "ready" | "error";

interface Sources {
  plansByHorizon: Record<PlanHorizon, Plan[]>;
  goals: Goal[];
  projects: Project[];
  milestones: Milestone[];
  roadmaps: Roadmap[];
}

async function loadSources(): Promise<Sources> {
  const [planTiers, goals, projects, milestones, roadmaps] = await Promise.all([
    Promise.all(PLAN_HORIZONS.map((horizon) => listActivePlans(horizon))),
    listActiveGoals(),
    listActiveProjects(),
    listActiveMilestones(),
    listActiveRoadmaps(),
  ]);
  const plansByHorizon = Object.fromEntries(
    PLAN_HORIZONS.map((horizon, index) => [horizon, planTiers[index] ?? []]),
  ) as Record<PlanHorizon, Plan[]>;
  return { plansByHorizon, goals, projects, milestones, roadmaps };
}

const EMPTY_SOURCES: Sources = {
  plansByHorizon: { "five-year": [], "one-year": [], quarter: [], month: [], week: [] },
  goals: [],
  projects: [],
  milestones: [],
  roadmaps: [],
};

export function useCascade() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [sources, setSources] = useState<Sources>(EMPTY_SOURCES);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    loadSources().then(
      (loaded) => {
        if (cancelled) return;
        setSources(loaded);
        setStatus("ready");
        setError(null);
      },
      (caught) => {
        if (cancelled) return;
        setStatus("error");
        setError(normalizeError(caught).message);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const cascade: Cascade = useMemo(() => buildCascade(sources), [sources]);

  return { status, cascade, error, reload };
}

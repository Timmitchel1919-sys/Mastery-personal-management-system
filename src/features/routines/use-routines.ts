"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listRecentRoutineLogs, routineLogRepository } from "./routine-log-repository";
import { listActiveRoutines, routineRepository } from "./routine-repository";
import { summarizeRoutines, type RoutinesStats } from "./routine-stats";
import type { Routine, RoutineCreate, RoutineLog, RoutineUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function newStepId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useRoutines() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    Promise.all([listActiveRoutines(), listRecentRoutineLogs()]).then(
      ([loadedRoutines, loadedLogs]) => {
        if (cancelled) return;
        setRoutines(loadedRoutines);
        setLogs(loadedLogs);
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

  const create = useCallback(async (input: RoutineCreate) => {
    const created = await routineRepository.create(input);
    setRoutines((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: RoutineUpdate) => {
    const updated = await routineRepository.update(id, patch);
    setRoutines((current) => current.map((routine) => (routine.id === id ? updated : routine)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await routineRepository.archive(id);
    setRoutines((current) => current.filter((routine) => routine.id !== id));
  }, []);

  const duplicateTemplate = useCallback(
    (template: Routine) =>
      create({
        title: template.title,
        description: template.description,
        routineType: template.routineType,
        pillarIds: template.pillarIds,
        isTemplate: false,
        steps: template.steps.map((step) => ({ ...step, id: newStepId() })),
      }),
    [create],
  );

  const todayLogByRoutine = useMemo(() => {
    const today = todayIso();
    const map = new Map<string, RoutineLog>();
    for (const log of logs) if (log.date === today) map.set(log.routineId, log);
    return map;
  }, [logs]);

  /** Toggle one step's completion in today's log for a routine — upserts the day's log. */
  const toggleStep = useCallback(
    async (routineId: string, stepId: string) => {
      const today = todayIso();
      const existing = todayLogByRoutine.get(routineId);
      if (existing) {
        const completedStepIds = existing.completedStepIds.includes(stepId)
          ? existing.completedStepIds.filter((id) => id !== stepId)
          : [...existing.completedStepIds, stepId];
        const updated = await routineLogRepository.update(existing.id, { completedStepIds });
        setLogs((current) => current.map((log) => (log.id === existing.id ? updated : log)));
        return updated;
      }
      const created = await routineLogRepository.create({
        routineId,
        date: today,
        completedStepIds: [stepId],
        notes: "",
      });
      setLogs((current) => [created, ...current]);
      return created;
    },
    [todayLogByRoutine],
  );

  const stats: RoutinesStats = useMemo(
    () => summarizeRoutines(routines, todayLogByRoutine),
    [routines, todayLogByRoutine],
  );

  return {
    status,
    routines,
    todayLogByRoutine,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    duplicateTemplate,
    toggleStep,
  };
}

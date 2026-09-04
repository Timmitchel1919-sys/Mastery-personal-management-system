"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { habitLogRepository, listRecentHabitLogs } from "./habit-log-repository";
import { habitRepository, listActiveHabits } from "./habit-repository";
import { summarizeHabits, type HabitsStats } from "./habit-stats";
import { computeHabitStreaks, recentDayStates, type HabitStreaks } from "./habit-streak";
import type { Habit, HabitCreate, HabitLog, HabitLogStatus, HabitUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useHabits() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    Promise.all([listActiveHabits(), listRecentHabitLogs()]).then(
      ([loadedHabits, loadedLogs]) => {
        if (cancelled) return;
        setHabits(loadedHabits);
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

  const create = useCallback(async (input: HabitCreate) => {
    const created = await habitRepository.create(input);
    setHabits((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: HabitUpdate) => {
    const updated = await habitRepository.update(id, patch);
    setHabits((current) => current.map((habit) => (habit.id === id ? updated : habit)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await habitRepository.archive(id);
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }, []);

  /** Upsert today's (or any) log for a habit — one log per habit per day. */
  const setDayStatus = useCallback(
    async (habitId: string, date: string, logStatus: HabitLogStatus) => {
      const existing = logs.find((log) => log.habitId === habitId && log.date === date);
      if (existing) {
        const updated = await habitLogRepository.update(existing.id, { logStatus });
        setLogs((current) => current.map((log) => (log.id === existing.id ? updated : log)));
        return updated;
      }
      const created = await habitLogRepository.create({
        habitId,
        date,
        logStatus,
        value: 0,
        notes: "",
      });
      setLogs((current) => [created, ...current]);
      return created;
    },
    [logs],
  );

  const logsByHabit = useMemo(() => {
    const map = new Map<string, HabitLog[]>();
    for (const log of logs) map.set(log.habitId, [...(map.get(log.habitId) ?? []), log]);
    return map;
  }, [logs]);

  const streaksByHabit = useMemo(() => {
    const today = todayIso();
    const map = new Map<string, HabitStreaks>();
    for (const habit of habits) {
      map.set(habit.id, computeHabitStreaks(habit, logsByHabit.get(habit.id) ?? [], today));
    }
    return map;
  }, [habits, logsByHabit]);

  const recentDaysByHabit = useMemo(() => {
    const today = todayIso();
    const map = new Map<string, ReturnType<typeof recentDayStates>>();
    for (const habit of habits) {
      map.set(habit.id, recentDayStates(habit, logsByHabit.get(habit.id) ?? [], today));
    }
    return map;
  }, [habits, logsByHabit]);

  const stats: HabitsStats = useMemo(
    () => summarizeHabits(habits, logs, todayIso()),
    [habits, logs],
  );

  return {
    status,
    habits,
    logsByHabit,
    streaksByHabit,
    recentDaysByHabit,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    setDayStatus,
  };
}

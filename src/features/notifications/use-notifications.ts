"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { goalRepository } from "@/features/goals/goal-repository";
import { milestoneRepository } from "@/features/milestones/milestone-repository";
import { taskRepository } from "@/features/tasks/task-repository";
import { habitRepository } from "@/features/habits/habit-repository";
import { habitLogRepository } from "@/features/habits/habit-log-repository";
import { kpiRepository } from "@/features/kpis/kpi-repository";
import { kpiEntryRepository } from "@/features/kpis/kpi-entry-repository";
import {
  archiveNotification,
  createNotificationIfAbsent,
  getNotificationPreferences,
  listRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPreferences,
} from "./notification-repository";
import {
  defaultNotificationPreferences,
  type AppNotification,
  type NotificationPreferences,
  type NotificationPreferencesInput,
} from "./notification-schema";
import { computeDueReminders } from "./reminder-scan";

type Status = "loading" | "ready" | "error";
const PAGE = 100;

function localParts(now: Date, timeZone: string): { day: string; time: string } {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    const hour = parts.hour === "24" ? "00" : parts.hour;
    return {
      day: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${hour}:${parts.minute}`,
    };
  } catch {
    return { day: now.toISOString().slice(0, 10), time: now.toISOString().slice(11, 16) };
  }
}

export function useNotifications() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    async function load() {
      const [loaded, loadedPrefs] = await Promise.all([
        listRecentNotifications(),
        getNotificationPreferences(),
      ]);
      if (cancelled) return;

      const effectivePrefs = loadedPrefs;
      const scanPrefs = effectivePrefs ?? {
        ...defaultNotificationPreferences(),
      };

      const [goals, milestones, tasks, habits, habitLogs, kpis, kpiEntries] = await Promise.all([
        goalRepository.list({ limit: PAGE }),
        milestoneRepository.list({ limit: PAGE }),
        taskRepository.list({ limit: PAGE }),
        habitRepository.list({ limit: PAGE }),
        habitLogRepository.list({ limit: PAGE, orderBy: "date", direction: "desc" }),
        kpiRepository.list({ limit: PAGE }),
        kpiEntryRepository.list({ limit: PAGE, orderBy: "date", direction: "desc" }),
      ]);
      if (cancelled) return;

      const now = new Date();
      const { day, time } = localParts(now, scanPrefs.timeZone);
      const seeds = computeDueReminders({
        now,
        localDay: day,
        localTime: time,
        prefs: {
          categories: scanPrefs.categories,
          milestoneLeadDays: scanPrefs.milestoneLeadDays,
          kpiStaleDays: scanPrefs.kpiStaleDays,
        },
        tasks: tasks.items.filter((t) => t.status === "active"),
        milestones: milestones.items.filter((m) => m.status === "active"),
        habits: habits.items.filter((h) => h.status === "active"),
        habitLogs: habitLogs.items.filter((l) => l.status === "active"),
        kpis: kpis.items.filter((k) => k.status === "active"),
        kpiEntries: kpiEntries.items.filter((e) => e.status === "active"),
        goals: goals.items.filter((g) => g.status === "active"),
      });

      const existingKeys = new Set(loaded.map((n) => n.dedupeKey).filter(Boolean));
      const created: AppNotification[] = [];
      for (const seed of seeds) {
        const madeOne = await createNotificationIfAbsent(seed, existingKeys);
        if (madeOne) {
          created.push(madeOne);
          existingKeys.add(seed.dedupeKey);
        }
      }
      if (cancelled) return;

      setItems(
        created.length > 0
          ? [...created, ...loaded].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          : loaded,
      );
      setPrefs(effectivePrefs);
      setStatus("ready");
      setError(null);
    }

    load().catch((caught) => {
      if (cancelled) return;
      setStatus("error");
      setError(normalizeError(caught).message);
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const markRead = useCallback(async (id: string, read = true) => {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, read } : n)));
    await markNotificationRead(id, read);
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = items.filter((n) => !n.read).map((n) => n.id);
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead(unread);
  }, [items]);

  const dismiss = useCallback(async (id: string) => {
    setItems((current) => current.filter((n) => n.id !== id));
    await archiveNotification(id);
  }, []);

  const savePrefs = useCallback(async (input: NotificationPreferencesInput) => {
    setSavingPrefs(true);
    try {
      setPrefs(await saveNotificationPreferences(input));
      return true;
    } finally {
      setSavingPrefs(false);
    }
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return {
    status,
    items,
    unreadCount,
    prefs,
    error,
    reload,
    markRead,
    markAllRead,
    dismiss,
    savePrefs,
    savingPrefs,
  };
}

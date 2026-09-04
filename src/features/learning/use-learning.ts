"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { learningItemRepository, listActiveLearningItems } from "./learning-item-repository";
import { studySessionRepository, listRecentStudySessions } from "./study-session-repository";
import { studyMinutesForItem, summarizeLearning, type LearningStats } from "./learning-stats";
import type {
  LearningItem,
  LearningItemCreate,
  LearningItemUpdate,
  StudySessionCreate,
} from "./schema";

type Status = "loading" | "ready" | "error";

export function useLearning() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<LearningItem[]>([]);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listRecentStudySessions>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    Promise.all([listActiveLearningItems(), listRecentStudySessions()]).then(
      ([loadedItems, loadedSessions]) => {
        if (cancelled) return;
        setItems(loadedItems);
        setSessions(loadedSessions);
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

  const create = useCallback(async (input: LearningItemCreate) => {
    const created = await learningItemRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: LearningItemUpdate) => {
    const updated = await learningItemRepository.update(id, patch);
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await learningItemRepository.archive(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toggleLesson = useCallback(
    (item: LearningItem, lessonId: string) => {
      const lessons = item.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, completed: !lesson.completed } : lesson,
      );
      return update(item.id, { lessons });
    },
    [update],
  );

  const logSession = useCallback(async (input: StudySessionCreate) => {
    const created = await studySessionRepository.create(input);
    setSessions((current) => [created, ...current]);
    return created;
  }, []);

  const removeSession = useCallback(async (id: string) => {
    await studySessionRepository.archive(id);
    setSessions((current) => current.filter((session) => session.id !== id));
  }, []);

  const studyMinutesByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.id, studyMinutesForItem(sessions, item.id));
    return map;
  }, [items, sessions]);

  const stats: LearningStats = useMemo(() => summarizeLearning(items, sessions), [items, sessions]);

  return {
    status,
    items,
    sessions,
    studyMinutesByItem,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    toggleLesson,
    logSession,
    removeSession,
  };
}

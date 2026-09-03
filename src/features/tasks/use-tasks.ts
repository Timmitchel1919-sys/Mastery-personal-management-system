"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listActiveTasks, taskRepository } from "./task-repository";
import { subtaskProgressByParent, summarizeTasks, type TaskStats } from "./task-stats";
import type { Task, TaskCreate, TaskStatus, TaskUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useTasks() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveTasks().then(
      (loaded) => {
        if (cancelled) return;
        setItems(loaded);
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

  const create = useCallback(async (input: TaskCreate) => {
    const created = await taskRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: TaskUpdate) => {
    const updated = await taskRepository.update(id, patch);
    setItems((current) => current.map((task) => (task.id === id ? updated : task)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await taskRepository.archive(id);
    setItems((current) => current.filter((task) => task.id !== id));
  }, []);

  const setStatusFor = useCallback(
    (task: Task, next: TaskStatus) => {
      const patch: TaskUpdate = { taskStatus: next };
      if (next === "done") patch.completedAt = task.completedAt ?? new Date().toISOString();
      else if (task.completedAt) patch.completedAt = null;
      return update(task.id, patch);
    },
    [update],
  );

  const stats: TaskStats = useMemo(() => summarizeTasks(items), [items]);
  const subtaskProgress = useMemo(() => subtaskProgressByParent(items), [items]);

  return {
    status,
    items,
    stats,
    subtaskProgress,
    error,
    reload,
    create,
    update,
    archive,
    setStatusFor,
  };
}

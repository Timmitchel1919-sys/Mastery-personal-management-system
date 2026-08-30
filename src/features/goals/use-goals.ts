"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { goalRepository, listActiveGoals } from "./goal-repository";
import type { Goal, GoalCreate, GoalUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useGoals() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveGoals().then(
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

  const create = useCallback(async (input: GoalCreate) => {
    const created = await goalRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: GoalUpdate) => {
    const updated = await goalRepository.update(id, patch);
    setItems((current) => current.map((goal) => (goal.id === id ? updated : goal)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await goalRepository.archive(id);
    setItems((current) => current.filter((goal) => goal.id !== id));
  }, []);

  return { status, items, error, reload, create, update, archive };
}

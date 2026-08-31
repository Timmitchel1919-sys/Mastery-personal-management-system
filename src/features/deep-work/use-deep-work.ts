"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { deepWorkRepository, listRecentDeepWork } from "./deep-work-repository";
import { summarizeDeepWork, type DeepWorkStats } from "./deep-work-stats";
import type { DeepWorkCreate, DeepWorkSession, DeepWorkUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useDeepWork() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<DeepWorkSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listRecentDeepWork(30).then(
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

  const create = useCallback(async (input: DeepWorkCreate) => {
    const created = await deepWorkRepository.create(input);
    setItems((current) => [created, ...current]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: DeepWorkUpdate) => {
    const updated = await deepWorkRepository.update(id, patch);
    setItems((current) => current.map((session) => (session.id === id ? updated : session)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await deepWorkRepository.archive(id);
    setItems((current) => current.filter((session) => session.id !== id));
  }, []);

  const stats: DeepWorkStats = useMemo(() => summarizeDeepWork(items), [items]);

  return { status, items, stats, error, reload, create, update, archive };
}

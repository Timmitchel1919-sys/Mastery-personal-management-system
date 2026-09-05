"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveWeeklySummary,
  deleteWeeklySummary,
  listRecentWeeklySummaries,
} from "./weekly-summary-repository";
import type { WeeklySummary } from "./schema";

type Status = "loading" | "ready" | "error";

export function useWeeklySummaries() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<WeeklySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listRecentWeeklySummaries().then(
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

  const archive = useCallback(async (id: string) => {
    await archiveWeeklySummary(id);
    setItems((current) => current.filter((summary) => summary.id !== id));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteWeeklySummary(id);
    setItems((current) => current.filter((summary) => summary.id !== id));
  }, []);

  return { status, items, error, reload, archive, remove };
}

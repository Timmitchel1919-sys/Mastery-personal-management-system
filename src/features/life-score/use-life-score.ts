"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { latestEntry, useKpis } from "@/features/kpis";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { computeLifeScore } from "./life-score";
import {
  lifeScoreEntryRepository,
  listRecentLifeScoreEntries,
} from "./life-score-entry-repository";
import { lifeScoreEntryInputFromResult, type LifeScoreEntry } from "./schema";

type Status = "loading" | "ready" | "error";

export function useLifeScore() {
  const { status: authStatus } = useAuth();
  const kpis = useKpis();
  const [historyStatus, setHistoryStatus] = useState<Status>("loading");
  const [history, setHistory] = useState<LifeScoreEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listRecentLifeScoreEntries().then(
      (loaded) => {
        if (cancelled) return;
        setHistory(loaded);
        setHistoryStatus("ready");
        setHistoryError(null);
      },
      (caught) => {
        if (cancelled) return;
        setHistoryStatus("error");
        setHistoryError(normalizeError(caught).message);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => {
    kpis.reload();
    setRefreshToken((token) => token + 1);
  }, [kpis]);

  const latestValueByKpi = useMemo(() => {
    const map = new Map<string, number>();
    for (const kpi of kpis.items) {
      const latest = latestEntry(kpis.entriesByKpi.get(kpi.id) ?? []);
      if (latest) map.set(kpi.id, latest.value);
    }
    return map;
  }, [kpis.items, kpis.entriesByKpi]);

  const result = useMemo(
    () => computeLifeScore(kpis.items, latestValueByKpi),
    [kpis.items, latestValueByKpi],
  );

  const status: Status =
    kpis.status === "error" || historyStatus === "error"
      ? "error"
      : kpis.status === "loading" || historyStatus === "loading"
        ? "loading"
        : "ready";

  const saveToday = useCallback(
    async (note: string) => {
      if (result.score === null) return null;
      const today = new Date().toISOString().slice(0, 10);
      const input = lifeScoreEntryInputFromResult(result.score, result.factors, today, note);
      const existing = history.find((entry) => entry.date === today);
      if (existing) {
        const updated = await lifeScoreEntryRepository.update(existing.id, input);
        setHistory((current) =>
          current.map((entry) => (entry.id === existing.id ? updated : entry)),
        );
        return updated;
      }
      const created = await lifeScoreEntryRepository.create(input);
      setHistory((current) => [created, ...current]);
      return created;
    },
    [history, result],
  );

  return {
    status,
    score: result.score,
    factors: result.factors,
    history,
    error: kpis.error ?? historyError,
    reload,
    saveToday,
  };
}

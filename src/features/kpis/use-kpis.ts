"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { kpiEntryRepository, listRecentKpiEntries } from "./kpi-entry-repository";
import { kpiRepository, listActiveKpis } from "./kpi-repository";
import { summarizeKpis, type KpisStats } from "./kpi-stats";
import type { Kpi, KpiCreate, KpiEntry, KpiEntryCreate, KpiUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useKpis() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Kpi[]>([]);
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    Promise.all([listActiveKpis(), listRecentKpiEntries()]).then(
      ([loadedKpis, loadedEntries]) => {
        if (cancelled) return;
        setItems(loadedKpis);
        setEntries(loadedEntries);
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

  const create = useCallback(async (input: KpiCreate) => {
    const created = await kpiRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: KpiUpdate) => {
    const updated = await kpiRepository.update(id, patch);
    setItems((current) => current.map((kpi) => (kpi.id === id ? updated : kpi)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await kpiRepository.archive(id);
    setItems((current) => current.filter((kpi) => kpi.id !== id));
  }, []);

  const addEntry = useCallback(async (input: KpiEntryCreate) => {
    const created = await kpiEntryRepository.create(input);
    setEntries((current) => [created, ...current]);
    return created;
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await kpiEntryRepository.archive(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const entriesByKpi = useMemo(() => {
    const map = new Map<string, KpiEntry[]>();
    for (const entry of entries) map.set(entry.kpiId, [...(map.get(entry.kpiId) ?? []), entry]);
    return map;
  }, [entries]);

  const stats: KpisStats = useMemo(() => summarizeKpis(items, entriesByKpi), [items, entriesByKpi]);

  return {
    status,
    items,
    entries,
    entriesByKpi,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    addEntry,
    removeEntry,
  };
}

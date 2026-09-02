"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { detectConflicts, type ConflictMap } from "./detect-conflicts";
import { listActiveTimeBlocks, timeBlockRepository } from "./time-block-repository";
import { summarizeTimeBlocks, type TimeBlockStats } from "./time-block-stats";
import type { TimeBlock, TimeBlockCreate, TimeBlockUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useTimeBlocking() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<TimeBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveTimeBlocks().then(
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

  const sortByStart = (list: TimeBlock[]) =>
    [...list].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
    );

  const create = useCallback(async (input: TimeBlockCreate) => {
    const created = await timeBlockRepository.create(input);
    setItems((current) => sortByStart([created, ...current]));
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: TimeBlockUpdate) => {
    const updated = await timeBlockRepository.update(id, patch);
    setItems((current) => sortByStart(current.map((block) => (block.id === id ? updated : block))));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await timeBlockRepository.archive(id);
    setItems((current) => current.filter((block) => block.id !== id));
  }, []);

  const conflicts: ConflictMap = useMemo(() => detectConflicts(items), [items]);
  const stats: TimeBlockStats = useMemo(() => summarizeTimeBlocks(items), [items]);

  return { status, items, conflicts, stats, error, reload, create, update, archive };
}

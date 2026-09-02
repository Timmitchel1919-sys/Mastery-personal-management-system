"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listActiveMatrixItems, priorityMatrixRepository } from "./priority-matrix-repository";
import { summarizeMatrix, type MatrixStats } from "./priority-matrix-stats";
import {
  MATRIX_QUADRANTS,
  type MatrixItem,
  type MatrixItemCreate,
  type MatrixItemUpdate,
  type MatrixQuadrant,
} from "./schema";

type Status = "loading" | "ready" | "error";

export function usePriorityMatrix() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<MatrixItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveMatrixItems().then(
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

  const create = useCallback(async (input: MatrixItemCreate) => {
    const created = await priorityMatrixRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: MatrixItemUpdate) => {
    const updated = await priorityMatrixRepository.update(id, patch);
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await priorityMatrixRepository.archive(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const move = useCallback(
    (id: string, quadrant: MatrixQuadrant) => update(id, { quadrant }),
    [update],
  );

  const toggleComplete = useCallback(
    (id: string, completed: boolean) => update(id, { completed }),
    [update],
  );

  const byQuadrant = useMemo(() => {
    const grouped = Object.fromEntries(
      MATRIX_QUADRANTS.map((quadrant) => [quadrant, [] as MatrixItem[]]),
    ) as Record<MatrixQuadrant, MatrixItem[]>;
    for (const item of items) grouped[item.quadrant].push(item);
    return grouped;
  }, [items]);

  const stats: MatrixStats = useMemo(() => summarizeMatrix(items), [items]);

  return {
    status,
    items,
    byQuadrant,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    move,
    toggleComplete,
  };
}

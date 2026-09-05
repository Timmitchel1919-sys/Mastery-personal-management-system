"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listRecoveryRelapses, recordRecoverySetback } from "./recovery-relapse-client";
import type { RecoveryRelapse, RecoveryRelapseRequest } from "./recovery-relapse-schema";

type Status = "loading" | "ready" | "error";

export function useRecoveryRelapses(goalId: string) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<RecoveryRelapse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    listRecoveryRelapses(goalId).then(
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
  }, [authStatus, goalId, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const logSetback = useCallback(
    async (payload: RecoveryRelapseRequest) => {
      setLogging(true);
      setLogError(null);
      try {
        await recordRecoverySetback(payload);
        setItems(await listRecoveryRelapses(goalId));
        return true;
      } catch (caught) {
        setLogError(normalizeError(caught).message);
        return false;
      } finally {
        setLogging(false);
      }
    },
    [goalId],
  );

  return { status, items, error, reload, logSetback, logging, logError };
}

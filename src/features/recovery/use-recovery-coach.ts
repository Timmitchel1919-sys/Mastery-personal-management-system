"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { askRecoveryCoach, listRecoveryCoachSessions } from "./recovery-coach-client";
import type { RecoveryCoachResult, RecoveryCoachSession } from "./recovery-coach-schema";

type Status = "loading" | "ready" | "error";

export function useRecoveryCoach(goalId: string) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [sessions, setSessions] = useState<RecoveryCoachSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    listRecoveryCoachSessions(goalId).then(
      (loaded) => {
        if (cancelled) return;
        setSessions(loaded);
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

  const ask = useCallback(
    async (message: string): Promise<RecoveryCoachResult | null> => {
      setAsking(true);
      setAskError(null);
      try {
        const result = await askRecoveryCoach({ goalId, message });
        setSessions(await listRecoveryCoachSessions(goalId));
        return result;
      } catch (caught) {
        setAskError(normalizeError(caught).message);
        return null;
      } finally {
        setAsking(false);
      }
    },
    [goalId],
  );

  return { status, sessions, error, reload, ask, asking, askError };
}

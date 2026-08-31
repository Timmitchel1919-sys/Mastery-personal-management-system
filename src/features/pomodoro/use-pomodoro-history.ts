"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listRecentSessions } from "./pomodoro-session-repository";
import { summarizeSessions, type PomodoroStats } from "./pomodoro-stats";
import type { PomodoroSession } from "./schema";

type Status = "loading" | "ready" | "error";

export function usePomodoroHistory() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listRecentSessions(20).then(
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
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);
  const stats: PomodoroStats = useMemo(() => summarizeSessions(sessions), [sessions]);

  return { status, sessions, stats, error, reload };
}

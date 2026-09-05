"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { callCoach, type CallCoachOptions } from "./ai-coach-client";
import { listRecentCoachExchanges } from "./coach-exchange-repository";
import type { AiIntent, CoachExchange } from "./schema";

type Status = "loading" | "ready" | "error";

export function useAiCoach() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [exchanges, setExchanges] = useState<CoachExchange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listRecentCoachExchanges().then(
      (loaded) => {
        if (cancelled) return;
        setExchanges(loaded);
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

  const ask = useCallback(async (intent: AiIntent, options: CallCoachOptions = {}) => {
    setAsking(true);
    setAskError(null);
    try {
      const result = await callCoach(intent, options);
      setExchanges(await listRecentCoachExchanges());
      return result;
    } catch (caught) {
      setAskError(normalizeError(caught).message);
      throw caught;
    } finally {
      setAsking(false);
    }
  }, []);

  return { status, exchanges, error, reload, ask, asking, askError };
}

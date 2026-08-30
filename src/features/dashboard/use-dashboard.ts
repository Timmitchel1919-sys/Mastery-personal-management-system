"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { loadDashboardAggregate, type DashboardAggregate } from "./dashboard-aggregate";

type Status = "loading" | "ready" | "error";

interface DashboardState {
  status: Status;
  data: DashboardAggregate | null;
  error: string | null;
}

export function useDashboard() {
  const { status: authStatus, profile, user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    status: "loading",
    data: null,
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    let cancelled = false;
    loadDashboardAggregate().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      },
      (error) => {
        if (!cancelled) {
          setState({ status: "error", data: null, error: normalizeError(error).message });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  return {
    status: state.status,
    aggregate: state.data,
    error: state.error,
    reload,
    profile,
    user,
  };
}

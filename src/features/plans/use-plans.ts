"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { getPlanRepository, listActivePlans } from "./repositories";
import type { Plan, PlanCreate, PlanHorizon, PlanUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function usePlans(horizon: PlanHorizon) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActivePlans(horizon).then(
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
  }, [authStatus, horizon, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const create = useCallback(
    async (input: PlanCreate) => {
      const created = await getPlanRepository(horizon).create(input);
      setItems((current) => [...current, created]);
      return created;
    },
    [horizon],
  );

  const update = useCallback(
    async (id: string, patch: PlanUpdate) => {
      const updated = await getPlanRepository(horizon).update(id, patch);
      setItems((current) => current.map((plan) => (plan.id === id ? updated : plan)));
      return updated;
    },
    [horizon],
  );

  const archive = useCallback(
    async (id: string) => {
      await getPlanRepository(horizon).archive(id);
      setItems((current) => current.filter((plan) => plan.id !== id));
    },
    [horizon],
  );

  return { status, items, error, reload, create, update, archive };
}

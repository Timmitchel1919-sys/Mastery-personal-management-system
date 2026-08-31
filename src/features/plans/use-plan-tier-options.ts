"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { listActivePlans, type PlanOption } from "./repositories";
import type { PlanHorizon } from "./schema";

/**
 * Active plans of a single tier as `{ id, title, horizon }` — for the parent-plan picker
 * in the planning cascade. A `null` tier (one with no parent) simply loads nothing.
 */
export function usePlanTierOptions(horizon: PlanHorizon | null) {
  const { status } = useAuth();
  const [options, setOptions] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(horizon !== null);

  useEffect(() => {
    if (status !== "authenticated" || horizon === null) return;
    let cancelled = false;
    listActivePlans(horizon).then(
      (plans) => {
        if (cancelled) return;
        setOptions(plans.map((plan) => ({ id: plan.id, title: plan.title, horizon })));
        setLoading(false);
      },
      () => {
        if (!cancelled) setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [status, horizon]);

  return { options, loading };
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { listAllPlanOptions, type PlanOption } from "./repositories";

/** Load the user's active plans across every tier for a "link to a plan" picker. */
export function usePlanOptions() {
  const { status } = useAuth();
  const [options, setOptions] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listAllPlanOptions().then(
      (loaded) => {
        if (cancelled) return;
        setOptions(loaded);
        setLoading(false);
      },
      () => {
        if (!cancelled) setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [status]);

  return { options, loading };
}

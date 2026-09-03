"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { listMilestoneOptions, type MilestoneOption } from "./milestone-repository";

/** Load the user's active milestones for a "link to a milestone" picker. */
export function useMilestoneOptions() {
  const { status } = useAuth();
  const [options, setOptions] = useState<MilestoneOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listMilestoneOptions().then(
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

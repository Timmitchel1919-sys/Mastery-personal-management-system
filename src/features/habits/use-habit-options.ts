"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { listHabitOptions, type HabitOption } from "./habit-repository";

/** Load the user's active habits for a "link to a habit" picker. */
export function useHabitOptions() {
  const { status } = useAuth();
  const [options, setOptions] = useState<HabitOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listHabitOptions().then(
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

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { listProjectOptions, type ProjectOption } from "./project-repository";

/** Load the user's active projects for a "link to a project" picker. */
export function useProjectOptions() {
  const { status } = useAuth();
  const [options, setOptions] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listProjectOptions().then(
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

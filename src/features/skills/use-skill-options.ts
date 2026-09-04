"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { listSkillOptions, type SkillOption } from "./skill-repository";

/** Load the user's active skills for a "link to a skill" picker. */
export function useSkillOptions() {
  const { status } = useAuth();
  const [options, setOptions] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listSkillOptions().then(
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import {
  createCheckIn,
  getCheckInForDate,
  listRecentCheckIns,
  updateCheckIn,
} from "./recovery-checkin-repository";
import { summarizeRecoveryProgress, type RecoveryProgress } from "./recovery-progress";
import type { RecoveryCheckIn, RecoveryCheckInCreate } from "./recovery-checkin-schema";

type Status = "loading" | "ready" | "error";

export function useRecoveryCheckIns(goalId: string) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<RecoveryCheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    listRecentCheckIns(goalId).then(
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
  }, [authStatus, goalId, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  /** Upserts the check-in for its date — one per goal per day. */
  const submitCheckIn = useCallback(
    async (input: RecoveryCheckInCreate) => {
      setSaving(true);
      try {
        const existing = await getCheckInForDate(goalId, input.date);
        const saved = existing
          ? await updateCheckIn(goalId, existing.id, input)
          : await createCheckIn(goalId, input);
        setItems((current) => {
          const without = current.filter((entry) => entry.id !== saved.id);
          return [saved, ...without].sort((a, b) => b.date.localeCompare(a.date));
        });
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [goalId],
  );

  const progress: RecoveryProgress = useMemo(() => summarizeRecoveryProgress(items), [items]);

  return { status, items, progress, error, reload, submitCheckIn, saving };
}

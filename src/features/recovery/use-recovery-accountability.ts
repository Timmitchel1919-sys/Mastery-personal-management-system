"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import {
  configureAccountabilityPartner,
  listAccountabilityPartners,
} from "./recovery-accountability-client";
import type {
  ConfigureAccountabilityRequest,
  RecoveryAccountabilityPartner,
} from "./recovery-accountability-schema";

type Status = "loading" | "ready" | "error";

export function useRecoveryAccountability(goalId: string) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [partners, setPartners] = useState<RecoveryAccountabilityPartner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    listAccountabilityPartners(goalId).then(
      (loaded) => {
        if (cancelled) return;
        setPartners(loaded);
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

  const configure = useCallback(
    async (payload: ConfigureAccountabilityRequest): Promise<boolean> => {
      setSaving(true);
      setSaveError(null);
      try {
        await configureAccountabilityPartner(payload);
        setPartners(await listAccountabilityPartners(goalId));
        return true;
      } catch (caught) {
        setSaveError(normalizeError(caught).message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [goalId],
  );

  return { status, partners, error, reload, configure, saving, saveError };
}

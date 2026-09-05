"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveCopingAction,
  createCopingAction,
  listCopingActions,
  updateCopingAction,
} from "./recovery-coping-repository";
import {
  copingInputFromSuggestion,
  type CopingSuggestion,
  type RecoveryCopingAction,
  type RecoveryCopingActionCreate,
  type RecoveryCopingActionUpdate,
} from "./recovery-coping-schema";

type Status = "loading" | "ready" | "error";

export function useRecoveryCoping(goalId: string) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<RecoveryCopingAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;

    listCopingActions(goalId).then(
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

  const addCopingAction = useCallback(
    async (input: RecoveryCopingActionCreate) => {
      setSaving(true);
      try {
        const created = await createCopingAction(goalId, input);
        setItems((current) => [...current, created]);
        return created;
      } finally {
        setSaving(false);
      }
    },
    [goalId],
  );

  const addSuggestion = useCallback(
    (suggestion: CopingSuggestion) => addCopingAction(copingInputFromSuggestion(suggestion)),
    [addCopingAction],
  );

  const editCopingAction = useCallback(
    async (id: string, patch: RecoveryCopingActionUpdate) => {
      const updated = await updateCopingAction(goalId, id, patch);
      setItems((current) => current.map((entry) => (entry.id === id ? updated : entry)));
      return updated;
    },
    [goalId],
  );

  const removeCopingAction = useCallback(
    async (id: string) => {
      await archiveCopingAction(goalId, id);
      setItems((current) => current.filter((entry) => entry.id !== id));
    },
    [goalId],
  );

  return {
    status,
    items,
    error,
    reload,
    addCopingAction,
    addSuggestion,
    editCopingAction,
    removeCopingAction,
    saving,
  };
}

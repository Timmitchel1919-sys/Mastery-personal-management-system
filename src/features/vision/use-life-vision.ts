"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { lifeVisionRepository, listActiveVisions } from "./vision-repository";
import type { LifeVision, LifeVisionCreate, LifeVisionUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useLifeVision() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<LifeVision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveVisions().then(
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
  }, [authStatus, refreshToken]);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  const create = useCallback(async (input: LifeVisionCreate) => {
    const created = await lifeVisionRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: LifeVisionUpdate) => {
    const updated = await lifeVisionRepository.update(id, patch);
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await lifeVisionRepository.archive(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return { status, items, error, reload, create, update, archive };
}

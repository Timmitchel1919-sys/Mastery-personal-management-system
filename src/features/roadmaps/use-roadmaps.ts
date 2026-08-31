"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listActiveRoadmaps, roadmapRepository } from "./roadmap-repository";
import type { Roadmap, RoadmapCreate, RoadmapUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useRoadmaps() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Roadmap[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveRoadmaps().then(
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

  const create = useCallback(async (input: RoadmapCreate) => {
    const created = await roadmapRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: RoadmapUpdate) => {
    const updated = await roadmapRepository.update(id, patch);
    setItems((current) => current.map((roadmap) => (roadmap.id === id ? updated : roadmap)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await roadmapRepository.archive(id);
    setItems((current) => current.filter((roadmap) => roadmap.id !== id));
  }, []);

  return { status, items, error, reload, create, update, archive };
}

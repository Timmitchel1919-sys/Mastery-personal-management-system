"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listActiveMilestones, milestoneRepository } from "./milestone-repository";
import type { Milestone, MilestoneCreate, MilestoneUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useMilestones() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Milestone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveMilestones().then(
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

  const create = useCallback(async (input: MilestoneCreate) => {
    const created = await milestoneRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: MilestoneUpdate) => {
    const updated = await milestoneRepository.update(id, patch);
    setItems((current) => current.map((milestone) => (milestone.id === id ? updated : milestone)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await milestoneRepository.archive(id);
    setItems((current) => current.filter((milestone) => milestone.id !== id));
  }, []);

  return { status, items, error, reload, create, update, archive };
}

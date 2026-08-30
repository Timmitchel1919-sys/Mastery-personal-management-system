"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listActiveProjects, projectRepository } from "./project-repository";
import type { Project, ProjectCreate, ProjectUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useProjects() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveProjects().then(
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

  const create = useCallback(async (input: ProjectCreate) => {
    const created = await projectRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: ProjectUpdate) => {
    const updated = await projectRepository.update(id, patch);
    setItems((current) => current.map((project) => (project.id === id ? updated : project)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await projectRepository.archive(id);
    setItems((current) => current.filter((project) => project.id !== id));
  }, []);

  return { status, items, error, reload, create, update, archive };
}

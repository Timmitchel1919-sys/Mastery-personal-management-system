"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { listRecentSkillReviews, skillReviewRepository } from "./skill-review-repository";
import { listActiveSkills, skillRepository } from "./skill-repository";
import { summarizeSkills, type SkillsStats } from "./skill-stats";
import type { Skill, SkillCreate, SkillReview, SkillReviewCreate, SkillUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useSkills() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Skill[]>([]);
  const [reviews, setReviews] = useState<SkillReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    Promise.all([listActiveSkills(), listRecentSkillReviews()]).then(
      ([loadedSkills, loadedReviews]) => {
        if (cancelled) return;
        setItems(loadedSkills);
        setReviews(loadedReviews);
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

  const create = useCallback(async (input: SkillCreate) => {
    const created = await skillRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: SkillUpdate) => {
    const updated = await skillRepository.update(id, patch);
    setItems((current) => current.map((skill) => (skill.id === id ? updated : skill)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await skillRepository.archive(id);
    setItems((current) => current.filter((skill) => skill.id !== id));
  }, []);

  const logReview = useCallback(async (input: SkillReviewCreate) => {
    const created = await skillReviewRepository.create(input);
    setReviews((current) => [created, ...current]);
    return created;
  }, []);

  const removeReview = useCallback(async (id: string) => {
    await skillReviewRepository.archive(id);
    setReviews((current) => current.filter((review) => review.id !== id));
  }, []);

  const reviewsBySkill = useMemo(() => {
    const map = new Map<string, SkillReview[]>();
    for (const review of reviews)
      map.set(review.skillId, [...(map.get(review.skillId) ?? []), review]);
    return map;
  }, [reviews]);

  const stats: SkillsStats = useMemo(
    () => summarizeSkills(items, reviewsBySkill),
    [items, reviewsBySkill],
  );

  return {
    status,
    items,
    reviewsBySkill,
    stats,
    error,
    reload,
    create,
    update,
    archive,
    logReview,
    removeReview,
  };
}

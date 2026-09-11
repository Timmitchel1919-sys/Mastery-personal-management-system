"use client";

import { useCallback, useState } from "react";
import type { ExplicitContextLink, ExplicitContextNote } from "./context-model";

/**
 * Layer P — explicit user context store.
 *
 * Per-viewer, user-authored context notes and "mark irrelevant" markers. Stored
 * in localStorage (the same pattern as decisions / personalization) so it stays
 * on the user's device and is never sent anywhere it is not asked for. Explicit
 * context always outranks inferred relevance in the engine.
 */

const NOTES_KEY = "mastery.context.notes";
const IRRELEVANT_KEY = "mastery.context.irrelevant";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function readNotes(): ExplicitContextNote[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse<ExplicitContextNote[]>(localStorage.getItem(NOTES_KEY), []);
}

function readIrrelevant(): string[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse<string[]>(localStorage.getItem(IRRELEVANT_KEY), []);
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // per-viewer convenience only
  }
}

function newId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface NewContextNote {
  title: string;
  body: string;
  tags?: string[];
  links?: ExplicitContextLink[];
  constraintDate?: string;
}

export function useUserContext() {
  const [notes, setNotes] = useState<ExplicitContextNote[]>(() => readNotes());
  const [irrelevantSourceIds, setIrrelevant] = useState<string[]>(() => readIrrelevant());

  const persistNotes = useCallback((next: ExplicitContextNote[]) => {
    setNotes(next);
    write(NOTES_KEY, next);
  }, []);

  const persistIrrelevant = useCallback((next: string[]) => {
    setIrrelevant(next);
    write(IRRELEVANT_KEY, next);
  }, []);

  const add = useCallback(
    (input: NewContextNote) => {
      const now = new Date().toISOString();
      const note: ExplicitContextNote = {
        id: newId(),
        title: input.title.trim() || "Untitled context",
        body: input.body.trim(),
        tags: input.tags ?? [],
        links: input.links ?? [],
        ...(input.constraintDate ? { constraintDate: input.constraintDate } : {}),
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      persistNotes([note, ...notes]);
      return note;
    },
    [notes, persistNotes],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<ExplicitContextNote, "id" | "createdAt">>) => {
      persistNotes(
        notes.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
        ),
      );
    },
    [notes, persistNotes],
  );

  const setStatus = useCallback(
    (id: string, status: ExplicitContextNote["status"]) => update(id, { status }),
    [update],
  );

  const remove = useCallback(
    (id: string) => persistNotes(notes.filter((note) => note.id !== id)),
    [notes, persistNotes],
  );

  const link = useCallback(
    (id: string, ref: ExplicitContextLink) => {
      const note = notes.find((entry) => entry.id === id);
      if (!note) return;
      if (note.links.some((existing) => existing.type === ref.type && existing.sourceId === ref.sourceId)) {
        return;
      }
      update(id, { links: [...note.links, ref] });
    },
    [notes, update],
  );

  const unlink = useCallback(
    (id: string, ref: ExplicitContextLink) => {
      const note = notes.find((entry) => entry.id === id);
      if (!note) return;
      update(id, {
        links: note.links.filter(
          (existing) => !(existing.type === ref.type && existing.sourceId === ref.sourceId),
        ),
      });
    },
    [notes, update],
  );

  const markIrrelevant = useCallback(
    (sourceId: string) => {
      if (irrelevantSourceIds.includes(sourceId)) return;
      persistIrrelevant([...irrelevantSourceIds, sourceId]);
    },
    [irrelevantSourceIds, persistIrrelevant],
  );

  const restoreRelevance = useCallback(
    (sourceId: string) => persistIrrelevant(irrelevantSourceIds.filter((id) => id !== sourceId)),
    [irrelevantSourceIds, persistIrrelevant],
  );

  return {
    notes,
    irrelevantSourceIds,
    add,
    update,
    setStatus,
    remove,
    link,
    unlink,
    markIrrelevant,
    restoreRelevance,
  };
}

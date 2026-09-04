"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { bookRepository, listActiveBooks } from "./book-repository";
import { summarizeReading, type ReadingStats } from "./reading-stats";
import type { Book, BookCreate, BookUpdate } from "./schema";

type Status = "loading" | "ready" | "error";

export function useReading() {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    listActiveBooks().then(
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

  const create = useCallback(async (input: BookCreate) => {
    const created = await bookRepository.create(input);
    setItems((current) => [...current, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: BookUpdate) => {
    const updated = await bookRepository.update(id, patch);
    setItems((current) => current.map((book) => (book.id === id ? updated : book)));
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    await bookRepository.archive(id);
    setItems((current) => current.filter((book) => book.id !== id));
  }, []);

  const toggleActionItem = useCallback(
    (book: Book, itemId: string) => {
      const actionItems = book.actionItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      );
      return update(book.id, { actionItems });
    },
    [update],
  );

  const stats: ReadingStats = useMemo(() => summarizeReading(items), [items]);

  return { status, items, stats, error, reload, create, update, archive, toggleActionItem };
}

"use client";

import { useCallback, useSyncExternalStore } from "react";
import { localeStore } from "./locale-store";
import type { Locale } from "./locales";

/** The active locale + a setter. Persists to localStorage and syncs `<html lang>`. */
export function useActiveLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );
  const setLocale = useCallback((next: Locale) => localeStore.setLocale(next), []);
  return { locale, setLocale };
}

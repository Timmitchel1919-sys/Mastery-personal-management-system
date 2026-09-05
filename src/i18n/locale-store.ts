import { DEFAULT_LOCALE, readStoredLocale, writeStoredLocale, type Locale } from "./locales";

/**
 * External store for `useSyncExternalStore` — mirrors `lib/theme.ts`'s `themeStore`. Holds
 * the active locale, keeps `<html lang>` in sync, and reacts to cross-tab changes.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
let current: Locale | null = null;

function applyLang(locale: Locale): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

export const localeStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "mastery.locale") return;
      current = readStoredLocale();
      applyLang(current);
      notify();
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  },

  getSnapshot(): Locale {
    if (current === null) current = readStoredLocale();
    return current;
  },

  getServerSnapshot(): Locale {
    return DEFAULT_LOCALE;
  },

  setLocale(locale: Locale): void {
    current = locale;
    writeStoredLocale(locale);
    applyLang(locale);
    notify();
  },
};

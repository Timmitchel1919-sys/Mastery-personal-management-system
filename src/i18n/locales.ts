/**
 * Internationalization (Layer 18). `next-intl` client-side only — the app is a static
 * export (ADR-0015), so there is no middleware, no `[locale]` route segment, and no
 * `next-intl/plugin`. `I18nProvider` loads the active locale's messages and feeds
 * `NextIntlClientProvider`; components call `useTranslations()`. English and Dutch ship at
 * launch; the architecture takes another locale by adding a `messages/<locale>.json` and a
 * line here (ADR-0005 / ADR-0027).
 */

export const LOCALES = ["en", "nl"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
};

export const LOCALE_STORAGE_KEY = "mastery.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(raw)) return raw;
    const nav = window.navigator?.language?.slice(0, 2);
    return isLocale(nav) ? nav : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // storage blocked (private mode) — the choice is session-only, non-fatal
  }
}

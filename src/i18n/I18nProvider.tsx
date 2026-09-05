"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { localeStore } from "./locale-store";
import { messagesFor } from "./messages";

/**
 * Wraps the app in `NextIntlClientProvider` with the active locale + its bundled messages.
 * Client-only (static export — no server i18n config). Changing the locale in Settings
 * updates `localeStore`, which re-renders this provider with the new catalogue.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messagesFor(locale)}
      // Formatting uses the viewer's own zone; date-only values are already ISO day keys.
      timeZone={
        typeof Intl !== "undefined"
          ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC")
          : "UTC"
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}

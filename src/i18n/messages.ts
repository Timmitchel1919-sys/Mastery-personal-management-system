import type { AbstractIntlMessages } from "next-intl";
import en from "../../messages/en.json";
import nl from "../../messages/nl.json";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const CATALOGUES: Record<Locale, AbstractIntlMessages> = {
  en: en as AbstractIntlMessages,
  nl: nl as AbstractIntlMessages,
};

/** The message catalogue for a locale, falling back to English. Bundled, no async load. */
export function messagesFor(locale: Locale): AbstractIntlMessages {
  return CATALOGUES[locale] ?? CATALOGUES[DEFAULT_LOCALE];
}

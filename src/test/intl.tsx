import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { messagesFor } from "@/i18n/messages";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";

/**
 * Test render that supplies `NextIntlClientProvider`. Defaults to English, whose catalogue
 * mirrors the pre-i18n copy, so existing text assertions keep passing.
 */
export function renderWithIntl(
  ui: ReactElement,
  {
    locale = DEFAULT_LOCALE,
    ...options
  }: { locale?: Locale } & Omit<RenderOptions, "wrapper"> = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messagesFor(locale)} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

export function IntlWrapper({
  children,
  locale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messagesFor(locale)} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}

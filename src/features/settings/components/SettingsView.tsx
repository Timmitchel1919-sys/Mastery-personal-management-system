"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/components/layout";
import {
  Card,
  CardContent,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ThemeToggle,
} from "@/components/ui";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { LOCALES, LOCALE_LABEL, useActiveLocale } from "@/i18n";
import { ProfileCard } from "./ProfileCard";

export function SettingsView() {
  const t = useTranslations("settings");
  const { locale, setLocale } = useActiveLocale();

  return (
    <PageContainer size="full" className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardContent className="space-y-5 p-6">
          <FormField
            label={t("language")}
            htmlFor="settings-language"
            description={t("languageHelp")}
          >
            <Select
              value={locale}
              onValueChange={(next) => setLocale(next as (typeof LOCALES)[number])}
            >
              <SelectTrigger id="settings-language" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {LOCALE_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t("theme")} description={t("themeHelp")}>
            <ThemeToggle />
          </FormField>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("install")}</p>
            <p className="text-subtle text-xs">{t("installHelp")}</p>
            <InstallAppButton tone="gold" showFallbackText />
          </div>
        </CardContent>
      </Card>

      <ProfileCard />

      <p className="text-subtle text-xs">
        {t("moreInSection")}{" "}
        <Link className="underline underline-offset-2" href="/notifications">
          {t("goToNotifications")}
        </Link>
      </p>
    </PageContainer>
  );
}

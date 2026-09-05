"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
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
import { useAuth } from "@/providers/auth-provider";
import { LOCALES, LOCALE_LABEL, useActiveLocale } from "@/i18n";
import { InstallButton } from "@/components/pwa";

export function SettingsView() {
  const t = useTranslations("settings");
  const { locale, setLocale } = useActiveLocale();
  const { profile, user } = useAuth();

  const name = profile?.displayName ?? user?.displayName ?? "—";
  const email = profile?.email ?? user?.email ?? "—";

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={<BreadcrumbTrail />}
      />

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
            <InstallButton label={t("installLabel")} installedLabel={t("installed")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="font-medium">{t("profile")}</h2>
          <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-subtle">{t("name")}</dt>
            <dd className="break-words">{name}</dd>
            <dt className="text-subtle">{t("email")}</dt>
            <dd className="break-words">{email}</dd>
          </dl>
          <p className="text-subtle text-xs">
            {t("moreInSection")}{" "}
            <Link className="underline underline-offset-2" href="/notifications">
              {t("goToNotifications")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, FormField, Input, Switch } from "@/components/ui";
import {
  NOTIFICATION_CATEGORIES,
  defaultNotificationPreferences,
  type NotificationCategory,
  type NotificationPreferences,
  type NotificationPreferencesInput,
} from "../notification-schema";

export function NotificationPreferencesPanel({
  prefs,
  saving,
  onSave,
}: {
  prefs: NotificationPreferences | null;
  saving: boolean;
  onSave: (input: NotificationPreferencesInput) => Promise<boolean>;
}) {
  const initial: NotificationPreferencesInput = prefs
    ? {
        categories: { ...defaultNotificationPreferences().categories, ...prefs.categories },
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        timeZone: prefs.timeZone,
        pushEnabled: prefs.pushEnabled,
        milestoneLeadDays: prefs.milestoneLeadDays,
        kpiStaleDays: prefs.kpiStaleDays,
      }
    : defaultNotificationPreferences();

  const t = useTranslations("notifications.prefs");
  const [draft, setDraft] = useState<NotificationPreferencesInput>(initial);
  const [savedFlash, setSavedFlash] = useState(false);

  function set<K extends keyof NotificationPreferencesInput>(
    key: K,
    value: NotificationPreferencesInput[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="font-medium">{t("title")}</h2>

        <div className="space-y-2">
          <p className="text-subtle text-xs">{t("whichReminders")}</p>
          {NOTIFICATION_CATEGORIES.map((category: NotificationCategory) => (
            <label key={category} className="flex items-center justify-between gap-3 text-sm">
              <span>{t(`categories.${category}`)}</span>
              <Switch
                checked={draft.categories[category] !== false}
                onCheckedChange={(next) =>
                  set("categories", { ...draft.categories, [category]: next === true })
                }
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={t("quietFrom")} optional htmlFor="qh-start">
            <Input
              id="qh-start"
              type="time"
              value={draft.quietHoursStart ?? ""}
              onChange={(e) => set("quietHoursStart", e.target.value || null)}
            />
          </FormField>
          <FormField label={t("quietTo")} optional htmlFor="qh-end">
            <Input
              id="qh-end"
              type="time"
              value={draft.quietHoursEnd ?? ""}
              onChange={(e) => set("quietHoursEnd", e.target.value || null)}
            />
          </FormField>
        </div>

        <FormField label={t("timeZone")} htmlFor="notif-tz" description={t("timeZoneHelp")}>
          <Input
            id="notif-tz"
            value={draft.timeZone}
            onChange={(e) => set("timeZone", e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={t("milestoneLead")} htmlFor="lead-days">
            <Input
              id="lead-days"
              type="number"
              min={0}
              max={60}
              value={draft.milestoneLeadDays}
              onChange={(e) => set("milestoneLeadDays", Number(e.target.value) || 0)}
            />
          </FormField>
          <FormField label={t("kpiStale")} htmlFor="stale-days">
            <Input
              id="stale-days"
              type="number"
              min={1}
              max={120}
              value={draft.kpiStaleDays}
              onChange={(e) => set("kpiStaleDays", Number(e.target.value) || 1)}
            />
          </FormField>
        </div>

        <FormField label={t("push")} htmlFor="push-toggle" description={t("pushHelp")}>
          <Switch
            id="push-toggle"
            checked={draft.pushEnabled}
            onCheckedChange={(next) => set("pushEnabled", next === true)}
          />
        </FormField>

        <div className="flex items-center gap-3">
          <Button
            loading={saving}
            onClick={async () => {
              const ok = await onSave(draft);
              if (ok) {
                setSavedFlash(true);
                setTimeout(() => setSavedFlash(false), 2000);
              }
            }}
          >
            {t("save")}
          </Button>
          {savedFlash ? <span className="text-subtle text-xs">{t("saved")}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

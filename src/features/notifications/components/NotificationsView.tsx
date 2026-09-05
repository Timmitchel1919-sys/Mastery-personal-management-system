"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Card, CardContent, IconButton, Skeleton } from "@/components/ui";
import { useNotifications } from "../use-notifications";
import { notificationHref, type AppNotification } from "../notification-schema";
import { NotificationPreferencesPanel } from "./NotificationPreferences";

function Row({
  notification,
  labels,
  onRead,
  onDismiss,
}: {
  notification: AppNotification;
  labels: { markRead: string; markUnread: string; dismiss: string };
  onRead: (id: string, read: boolean) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-md border p-3 text-sm ${
        notification.read ? "opacity-70" : "bg-muted/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <Link
          href={notificationHref(notification.type, notification.relatedId)}
          className="font-medium break-words hover:underline"
          onClick={() => {
            if (!notification.read) onRead(notification.id, true);
          }}
        >
          {notification.title}
        </Link>
        {notification.body ? <p className="text-muted break-words">{notification.body}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton
          size="sm"
          aria-label={notification.read ? labels.markUnread : labels.markRead}
          icon={<Check />}
          onClick={() => onRead(notification.id, !notification.read)}
        />
        <IconButton
          size="sm"
          aria-label={labels.dismiss}
          icon={<X />}
          onClick={() => onDismiss(notification.id)}
        />
      </div>
    </li>
  );
}

export function NotificationsView() {
  const {
    status,
    items,
    unreadCount,
    prefs,
    error,
    reload,
    markRead,
    markAllRead,
    dismiss,
    savePrefs,
    savingPrefs,
  } = useNotifications();

  const t = useTranslations("notifications");
  const rowLabels = {
    markRead: t("markRead"),
    markUnread: t("markUnread"),
    dismiss: t("dismiss"),
  };

  const unread = items.filter((n) => !n.read);
  const earlier = items.filter((n) => n.read);

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          unreadCount > 0 ? (
            <Button variant="ghost" onClick={markAllRead}>
              {t("markAllRead")}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {status === "loading" ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-16" />
              ))}
            </div>
          ) : status === "error" ? (
            <ErrorState title={t("loadError")} description={error ?? undefined} onRetry={reload} />
          ) : items.length === 0 ? (
            <EmptyState title={t("allCaughtTitle")} description={t("allCaughtBody")} />
          ) : (
            <>
              {unread.length > 0 ? (
                <section className="space-y-2">
                  <h2 className="text-subtle text-xs font-medium">
                    {t("unread", { count: unread.length })}
                  </h2>
                  <ul className="space-y-2">
                    {unread.map((n) => (
                      <Row
                        key={n.id}
                        notification={n}
                        labels={rowLabels}
                        onRead={markRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
              {earlier.length > 0 ? (
                <section className="space-y-2">
                  <h2 className="text-subtle text-xs font-medium">{t("earlier")}</h2>
                  <ul className="space-y-2">
                    {earlier.map((n) => (
                      <Row
                        key={n.id}
                        notification={n}
                        labels={rowLabels}
                        onRead={markRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>

        {status === "ready" ? (
          <NotificationPreferencesPanel prefs={prefs} saving={savingPrefs} onSave={savePrefs} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

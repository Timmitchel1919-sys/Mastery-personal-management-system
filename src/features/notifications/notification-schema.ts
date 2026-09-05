import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";

/**
 * Notifications (Layer 17) — `users/{uid}/notifications/{id}`. In-app notifications and
 * reminders. Reminder rows are created **client-side** by a due-item scan
 * (`reminder-scan.ts`); the weekly-summary row is written by the scheduled Cloud Function
 * (Layer 14). A server-side reminder sweep + FCM push is documented for later (ADR-0026) —
 * it needs Blaze, a VAPID key, and a service worker. `dedupeKey` prevents the client scan
 * from re-creating the same reminder; it is absent on the Layer 14 rows, hence the default.
 */

export const NOTIFICATION_TYPES = [
  "weekly-summary",
  "task-due",
  "milestone-due",
  "habit-due",
  "kpi-stale",
  "event-today",
  "planning-review",
] as const;
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CATEGORIES = ["updates", "tasks", "habits", "planning", "kpis"] as const;
export const notificationCategorySchema = z.enum(NOTIFICATION_CATEGORIES);
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> = {
  updates: "Updates & summaries",
  tasks: "Task & event reminders",
  habits: "Habit reminders",
  planning: "Planning reviews",
  kpis: "KPI check-ins",
};

export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  "weekly-summary": "updates",
  "task-due": "tasks",
  "event-today": "tasks",
  "milestone-due": "planning",
  "planning-review": "planning",
  "habit-due": "habits",
  "kpi-stale": "kpis",
};

const notificationFieldsSchema = z.object({
  type: notificationTypeSchema,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(1000),
  relatedId: z.string().nullable().default(null),
  dedupeKey: z.string().default(""),
  read: z.boolean(),
});

export const notificationSchema = defineRecordSchema(notificationFieldsSchema.shape);
export type AppNotification = z.infer<typeof notificationSchema>;

export const notificationCreateSchema = notificationFieldsSchema;
export type NotificationCreate = z.infer<typeof notificationCreateSchema>;

export const notificationUpdateSchema = notificationFieldsSchema.partial();
export type NotificationUpdate = z.infer<typeof notificationUpdateSchema>;

/** Safe in-app deep link for a notification. Unknown/absent targets land on a section page. */
export function notificationHref(type: NotificationType, relatedId: string | null): string {
  switch (type) {
    case "weekly-summary":
      return "/grow";
    case "task-due":
      return relatedId ? `/plan/tasks?task=${encodeURIComponent(relatedId)}` : "/plan/tasks";
    case "milestone-due":
      return "/plan/milestones";
    case "planning-review":
      return "/plan/goals";
    case "habit-due":
      return "/act/habits";
    case "kpi-stale":
      return "/analytics/kpis";
    case "event-today":
      return "/focus/calendar";
    default:
      return "/notifications";
  }
}

// ── Preferences (singleton: users/{uid}/notificationPreferences/{uid}) ────────
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm");

const preferencesFieldsSchema = z.object({
  categories: z.record(notificationCategorySchema, z.boolean()),
  quietHoursStart: timeSchema.nullable(),
  quietHoursEnd: timeSchema.nullable(),
  timeZone: z.string().trim().min(1).max(64),
  pushEnabled: z.boolean(),
  milestoneLeadDays: z.number().int().min(0).max(60),
  kpiStaleDays: z.number().int().min(1).max(120),
});

export const notificationPreferencesSchema = defineRecordSchema(preferencesFieldsSchema.shape);
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const notificationPreferencesInputSchema = preferencesFieldsSchema;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesInputSchema>;

export const notificationPreferencesUpdateSchema = preferencesFieldsSchema.partial();
export type NotificationPreferencesUpdate = z.infer<typeof notificationPreferencesUpdateSchema>;

export function resolveBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function defaultNotificationPreferences(): NotificationPreferencesInput {
  return {
    categories: {
      updates: true,
      tasks: true,
      habits: true,
      planning: true,
      kpis: true,
    },
    quietHoursStart: null,
    quietHoursEnd: null,
    timeZone: resolveBrowserTimeZone(),
    pushEnabled: false,
    milestoneLeadDays: 7,
    kpiStaleDays: 14,
  };
}

/** True when `HH:mm` falls inside the (possibly midnight-crossing) quiet window. */
export function isWithinQuietHours(
  time: string,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  if (start === end) return false;
  return start < end ? time >= start && time < end : time >= start || time < end;
}

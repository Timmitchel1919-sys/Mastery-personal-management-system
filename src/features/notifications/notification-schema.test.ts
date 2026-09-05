import { describe, expect, it } from "vitest";
import {
  defaultNotificationPreferences,
  isWithinQuietHours,
  notificationHref,
  notificationPreferencesSchema,
  notificationSchema,
} from "./notification-schema";

describe("notificationSchema", () => {
  it("defaults dedupeKey and relatedId on a Layer 14-style row", () => {
    const record = notificationSchema.parse({
      id: "n1",
      type: "weekly-summary",
      title: "Your weekly summary is ready",
      body: "Covering 2026-08-30 to 2026-09-05.",
      read: false,
      status: "active",
      version: 1,
      createdAt: "2026-09-05T00:00:00.000Z",
      updatedAt: "2026-09-05T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.relatedId).toBeNull();
    expect(record.dedupeKey).toBe("");
  });

  it("rejects an unknown type", () => {
    expect(
      notificationSchema.safeParse({ id: "n1", type: "spam", title: "x", body: "", read: false })
        .success,
    ).toBe(false);
  });
});

describe("notificationHref", () => {
  it("maps types to safe in-app routes and passes a task id through", () => {
    expect(notificationHref("weekly-summary", null)).toBe("/grow");
    expect(notificationHref("task-due", "t 1")).toBe("/plan/tasks?task=t%201");
    expect(notificationHref("task-due", null)).toBe("/plan/tasks");
    expect(notificationHref("habit-due", "h1")).toBe("/act/habits");
    expect(notificationHref("kpi-stale", "k1")).toBe("/analytics/kpis");
  });
});

describe("isWithinQuietHours", () => {
  it("handles a normal window", () => {
    expect(isWithinQuietHours("23:30", "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours("12:00", "22:00", "07:00")).toBe(false);
  });
  it("handles a same-day window and missing bounds", () => {
    expect(isWithinQuietHours("13:00", "12:00", "14:00")).toBe(true);
    expect(isWithinQuietHours("13:00", null, "14:00")).toBe(false);
    expect(isWithinQuietHours("13:00", "12:00", "12:00")).toBe(false);
  });
});

describe("notificationPreferencesSchema + defaults", () => {
  it("validates a stored preferences record built from the defaults", () => {
    const record = notificationPreferencesSchema.parse({
      id: "u1",
      ...defaultNotificationPreferences(),
      status: "active",
      version: 1,
      createdAt: "2026-09-05T00:00:00.000Z",
      updatedAt: "2026-09-05T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.categories.tasks).toBe(true);
    expect(record.pushEnabled).toBe(false);
    expect(record.milestoneLeadDays).toBe(7);
  });
});

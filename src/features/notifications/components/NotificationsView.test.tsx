import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification } from "../notification-schema";

const markRead = vi.fn();
const markAllRead = vi.fn();
const dismiss = vi.fn();
const savePrefs = vi.fn();
const reload = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/notifications" }));
vi.mock("../use-notifications", () => ({ useNotifications: () => hookValue }));

import { NotificationsView } from "./NotificationsView";

function notif(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    type: "task-due",
    title: "Due today: Ship",
    body: "This task is due today.",
    relatedId: "t1",
    dedupeKey: "task-due:t1:2026-09-05",
    read: false,
    status: "active",
    version: 1,
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-05T09:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    ...over,
  };
}

beforeEach(() => {
  [markRead, markAllRead, dismiss, savePrefs, reload].forEach((fn) => fn.mockReset());
  savePrefs.mockResolvedValue(true);
  hookValue = {
    status: "ready",
    items: [],
    unreadCount: 0,
    prefs: null,
    error: null,
    reload,
    markRead,
    markAllRead,
    dismiss,
    savePrefs,
    savingPrefs: false,
  };
});

describe("NotificationsView", () => {
  it("shows the empty state and the separateness note", () => {
    render(<NotificationsView />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(
      screen.getByText(/Recovery Center notifications are separate and never shown here/i),
    ).toBeInTheDocument();
  });

  it("splits unread and earlier, and deep-links the title", () => {
    hookValue.items = [notif(), notif({ id: "n2", read: true, title: "Read one" })];
    hookValue.unreadCount = 1;
    render(<NotificationsView />);
    expect(screen.getByText("Unread (1)")).toBeInTheDocument();
    expect(screen.getByText("Earlier")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Due today: Ship" })).toHaveAttribute(
      "href",
      "/plan/tasks?task=t1",
    );
  });

  it("marks all read", async () => {
    hookValue.items = [notif()];
    hookValue.unreadCount = 1;
    render(<NotificationsView />);
    await userEvent.click(screen.getByRole("button", { name: /mark all read/i }));
    expect(markAllRead).toHaveBeenCalledTimes(1);
  });

  it("dismisses a notification", async () => {
    hookValue.items = [notif()];
    render(<NotificationsView />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismiss).toHaveBeenCalledWith("n1");
  });

  it("saves preferences from the panel", async () => {
    render(<NotificationsView />);
    await userEvent.click(screen.getByRole("button", { name: /save preferences/i }));
    expect(savePrefs).toHaveBeenCalledTimes(1);
  });
});

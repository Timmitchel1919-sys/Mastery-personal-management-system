import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as GoalsModule from "@/features/goals";
import type * as ProjectsModule from "@/features/projects";
import { monthMatrix, weekDates } from "../calendar-range";
import type { EventOccurrence } from "../recurrence";
import type { CalendarEvent } from "../schema";

const setView = vi.fn();
const goPrev = vi.fn();
const goNext = vi.fn();
const goToday = vi.fn();
const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();

let calendar: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/calendar" }));
vi.mock("@/hooks/use-mounted", () => ({ useMounted: () => true }));
vi.mock("../use-calendar", () => ({ useCalendar: () => calendar }));
vi.mock("@/features/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof GoalsModule>()),
  useGoalOptions: () => ({ options: [], loading: false }),
}));
vi.mock("@/features/projects", async (importOriginal) => ({
  ...(await importOriginal<typeof ProjectsModule>()),
  useProjectOptions: () => ({ options: [], loading: false }),
}));

import { CalendarView } from "./CalendarView";

const anchor = new Date(2026, 8, 15);

const event: CalendarEvent = {
  id: "e1",
  status: "active",
  version: 1,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Team sync",
  description: "",
  location: "",
  allDay: false,
  timeZone: "UTC",
  startDateTime: "2026-09-15T09:00:00Z",
  endDateTime: "2026-09-15T09:30:00Z",
  startDate: null,
  endDate: null,
  recurrence: null,
  reminders: [],
  goalId: null,
  projectId: null,
};

const occurrence: EventOccurrence = {
  key: "e1:1",
  event,
  start: new Date(2026, 8, 15, 9, 0),
  end: new Date(2026, 8, 15, 9, 30),
  allDay: false,
  recurring: false,
};

beforeEach(() => {
  [setView, goPrev, goNext, goToday, reload, create, update, remove].forEach((fn) =>
    fn.mockReset(),
  );
  calendar = {
    status: "ready",
    error: null,
    reload,
    view: "month",
    setView,
    anchor,
    setAnchor: vi.fn(),
    label: "September 2026",
    days: monthMatrix(anchor).flat(),
    range: { start: anchor, end: anchor },
    occurrences: [occurrence],
    goToday,
    goPrev,
    goNext,
    create,
    update,
    remove,
  };
});

describe("CalendarView", () => {
  it("renders the month grid with the period label and an event chip", () => {
    render(<CalendarView />);
    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(screen.getByText("Team sync")).toBeInTheDocument();
  });

  it("switches the view via the segmented control", async () => {
    render(<CalendarView />);
    await userEvent.click(screen.getByText("Week"));
    expect(setView).toHaveBeenCalledWith("week");
  });

  it("navigates with the toolbar buttons", async () => {
    render(<CalendarView />);
    await userEvent.click(screen.getByRole("button", { name: "Next period" }));
    expect(goNext).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(goToday).toHaveBeenCalledTimes(1);
  });

  it("opens the new-event dialog", async () => {
    render(<CalendarView />);
    await userEvent.click(screen.getByRole("button", { name: /new event/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("opens an existing event when its chip is clicked", async () => {
    render(<CalendarView />);
    await userEvent.click(screen.getByText("Team sync"));
    expect(await screen.findByDisplayValue("Team sync")).toBeInTheDocument();
  });

  it("renders the week grid when the view is week", () => {
    calendar.view = "week";
    calendar.days = weekDates(anchor);
    render(<CalendarView />);
    expect(screen.getByText("all day")).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    calendar = { ...calendar, status: "error", error: "boom" };
    render(<CalendarView />);
    expect(screen.getByText("We couldn't load your calendar")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

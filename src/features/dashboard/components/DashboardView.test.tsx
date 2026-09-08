import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reload = vi.fn();
let dashboardValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("../use-dashboard", () => ({ useDashboard: () => dashboardValue }));

import { DashboardView } from "./DashboardView";

const emptyAggregate = {
  generatedAt: "2026-08-28T00:00:00.000Z",
  quickNotes: [],
  tasksCompletedToday: null,
  focusMinutesToday: null,
  habitsLoggedToday: null,
  goalProgress: null,
  planningAlignment: null,
  lifeScore: null,
  todaysPriorities: [],
  upcomingMilestones: [],
  habitStreaks: [],
  kpiOverview: [],
};

beforeEach(() => {
  reload.mockReset();
  dashboardValue = {
    status: "ready",
    aggregate: emptyAggregate,
    error: null,
    reload,
    profile: { displayName: "Ada Lovelace", language: "en", timezone: "UTC" },
    user: null,
  };
});

describe("DashboardView", () => {
  it("greets the user by their profile name, not a hardcoded value", () => {
    render(<DashboardView />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Ada Lovelace");
    expect(heading.textContent).toMatch(/Good (morning|afternoon|evening)|Welcome back/);
  });

  it("derives a name from the email when there is no profile name", () => {
    dashboardValue.profile = null;
    dashboardValue.user = { displayName: null, email: "grace@example.com" };
    render(<DashboardView />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("grace");
  });

  it("makes Today's Focus the primary anchor with an intentional empty state", () => {
    render(<DashboardView />);
    expect(screen.getByRole("heading", { name: /today's focus/i })).toBeInTheDocument();
    expect(screen.getByText("Nothing locked in yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open weekly plan/i })).toHaveAttribute(
      "href",
      "/plan/weekly",
    );
  });

  it("renders the six core modules around the central Mastery anchor", () => {
    render(<DashboardView />);
    expect(screen.getByRole("region", { name: /your mastery/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /structure your day/i })).toHaveAttribute(
      "href",
      "/plan",
    );
    expect(
      screen.getByRole("link", { name: /turn direction into measurable outcomes/i }),
    ).toHaveAttribute("href", "/plan/goals");
    expect(screen.getByRole("link", { name: /understand your trajectory/i })).toHaveAttribute(
      "href",
      "/analytics",
    );
  });

  it("keeps the quick-notes widget and shows the timeline empty state", () => {
    render(<DashboardView />);
    expect(screen.getByText("Quick notes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /today's timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plan time blocks/i })).toHaveAttribute(
      "href",
      "/focus/time-blocking",
    );
  });

  it("shows performance metrics as dashes until later layers supply real data", () => {
    render(<DashboardView />);
    expect(screen.getByRole("heading", { name: /performance/i })).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Not tracked yet").length).toBeGreaterThanOrEqual(3);
  });

  it("offers a privacy-safe recovery shortcut with no sensitive detail", () => {
    render(<DashboardView />);
    const link = screen.getByRole("link", { name: /recovery center/i });
    expect(link).toHaveAttribute("href", "/recovery");
    expect(link).toHaveTextContent("Private check-in");
  });

  it("renders an error state with a working retry", async () => {
    dashboardValue = {
      status: "error",
      aggregate: null,
      error: "network down",
      reload,
      profile: null,
      user: null,
    };
    render(<DashboardView />);
    expect(screen.getByText("We couldn't load your dashboard")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/goals" }));

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarNav } from "./sidebar-nav";
import { TooltipProvider } from "@/components/ui";

function renderNav() {
  return renderWithIntl(
    <TooltipProvider>
      <SidebarNav />
    </TooltipProvider>,
  );
}

describe("SidebarNav", () => {
  it("renders section headings and links", () => {
    renderNav();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Grow")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Goals" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("marks the active route", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("labels the primary navigation landmark", () => {
    renderNav();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("opens the active section and keeps the others collapsed", () => {
    renderNav();
    expect(screen.getByRole("button", { name: "Plan" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Focus" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Pomodoro" })).not.toBeInTheDocument();
  });

  it("toggles a section's dropdown open and closed on click", async () => {
    renderNav();
    const focusToggle = screen.getByRole("button", { name: "Focus" });

    await userEvent.click(focusToggle);
    expect(focusToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Pomodoro" })).toBeInTheDocument();

    await userEvent.click(focusToggle);
    expect(focusToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Pomodoro" })).not.toBeInTheDocument();
  });

  it("keeps Recovery Center a direct link, never behind a dropdown toggle", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Recovery Center" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /recovery/i })).not.toBeInTheDocument();
  });
});

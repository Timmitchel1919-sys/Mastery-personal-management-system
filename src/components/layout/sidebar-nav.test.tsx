import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/goals" }));

import { screen } from "@testing-library/react";
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
});

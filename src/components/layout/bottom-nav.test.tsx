import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/pomodoro" }));

import { BottomNav } from "./bottom-nav";

describe("BottomNav", () => {
  it("renders the five loop entry points", () => {
    renderWithIntl(<BottomNav />);
    for (const label of ["Dashboard", "Plan", "Focus", "Act", "Grow"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the section that contains the current route", () => {
    renderWithIntl(<BottomNav />);
    expect(screen.getByRole("link", { name: "Focus" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Plan" })).not.toHaveAttribute("aria-current");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/focus/pomodoro" }));

import { BottomNav } from "./bottom-nav";

describe("BottomNav", () => {
  it("renders the five loop entry points", () => {
    render(<BottomNav />);
    for (const label of ["Dashboard", "Plan", "Focus", "Act", "Grow"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the section that contains the current route", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "Focus" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Plan" })).not.toHaveAttribute("aria-current");
  });
});

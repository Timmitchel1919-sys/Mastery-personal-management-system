import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PersonalPattern } from "../personal-signals";
import { PersonalPatternCard } from "./PersonalPatternCard";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

const pattern: PersonalPattern = {
  id: "metric-trend-focus",
  observed: "Focus hours moved +22% over the 30 days (18 entries).",
  interpretation: "Your data shows an improving run for this measure.",
  recommendation: "Consider keeping the current routine while it holds.",
  sufficiency: "emerging",
  source: "18 KPI entries",
  trend: "improving",
  action: { label: "Open analytics", href: "/analytics" },
};

describe("PersonalPatternCard", () => {
  it("keeps observed, interpretation and recommendation visibly separate", () => {
    render(<PersonalPatternCard pattern={pattern} onReject={vi.fn()} />);
    expect(screen.getByText("Observed")).toBeInTheDocument();
    expect(screen.getByText("Interpretation")).toBeInTheDocument();
    expect(screen.getByText("Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Emerging pattern")).toBeInTheDocument();
    expect(screen.getByText(pattern.observed)).toBeInTheDocument();
  });

  it("explains its provenance behind 'Why am I seeing this?'", async () => {
    render(<PersonalPatternCard pattern={pattern} onReject={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: /why am i seeing this/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/derived this from your recorded activity/i)).toBeInTheDocument();
  });

  it("rejects the pattern when the user says it is not accurate", async () => {
    const onReject = vi.fn();
    render(<PersonalPatternCard pattern={pattern} onReject={onReject} />);
    await userEvent.click(screen.getByRole("button", { name: "Not accurate" }));
    expect(onReject).toHaveBeenCalledWith("metric-trend-focus");
  });
});

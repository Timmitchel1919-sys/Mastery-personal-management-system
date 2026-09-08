import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PredictiveSignal } from "../prediction-model";
import { PredictionCard } from "./PredictionCard";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

const signal: PredictiveSignal = {
  id: "deadline-risk-g1",
  category: "deadline-risk",
  urgency: "critical",
  prediction: '"Ship v1" may need additional time before 2026-03-13.',
  evidence: ["Deadline in 3 days", "Recorded progress: 30%", "~4h of estimated work remaining"],
  confidence: "moderate",
  timeWindow: "next 3 days",
  recommendation: "Consider protecting focus time for it, or moving the target date.",
  action: { label: "Review plan", href: "/plan/goals" },
  generatedAt: "2026-03-10T09:00:00.000Z",
};

describe("PredictionCard", () => {
  it("shows a hedged prediction, a qualitative confidence and the recommendation", () => {
    render(<PredictionCard signal={signal} onDismiss={vi.fn()} />);
    expect(screen.getByText(signal.prediction)).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText(/Moderate confidence/)).toBeInTheDocument();
    expect(screen.getByText(/Consider protecting focus time/)).toBeInTheDocument();
    // no fabricated percentage
    expect(screen.queryByText(/\d+% (likely|confident|probability)/i)).not.toBeInTheDocument();
  });

  it("reveals the supporting facts behind 'Why?'", async () => {
    render(<PredictionCard signal={signal} onDismiss={vi.fn()} />);
    const why = screen.getByRole("button", { name: "Why?" });
    expect(why).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(why);
    expect(screen.getByText("~4h of estimated work remaining")).toBeInTheDocument();
    expect(screen.getByText(/not a certainty/i)).toBeInTheDocument();
  });

  it("dismisses when the user marks it wrong", async () => {
    const onDismiss = vi.fn();
    render(<PredictionCard signal={signal} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Mastery got this wrong" }));
    expect(onDismiss).toHaveBeenCalledWith("deadline-risk-g1");
  });
});

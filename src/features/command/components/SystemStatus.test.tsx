import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let autonomyValue: { paused: boolean };
let intelligenceValue: { status: "loading" | "ready" | "error"; error: string | null };

vi.mock("@/features/autonomy", () => ({ useAutonomy: () => autonomyValue }));
vi.mock("@/features/intelligence", () => ({ useIntelligence: () => intelligenceValue }));

import { SystemStatus } from "./SystemStatus";

beforeEach(() => {
  autonomyValue = { paused: false };
  intelligenceValue = { status: "ready", error: null };
});

describe("SystemStatus", () => {
  it("shows 'All systems normal' when nothing is degraded", () => {
    render(<SystemStatus />);
    expect(screen.getByRole("status")).toHaveAttribute("title", "All systems normal");
  });

  it("shows 'Automation paused' when the emergency stop is active — takes priority", () => {
    autonomyValue = { paused: true };
    intelligenceValue = { status: "error", error: "boom" };
    render(<SystemStatus />);
    expect(screen.getByRole("status")).toHaveAttribute("title", "Automation paused");
  });

  it("shows 'AI limited' when intelligence errors for a non-network reason", () => {
    intelligenceValue = { status: "error", error: "provider unavailable" };
    render(<SystemStatus />);
    expect(screen.getByRole("status")).toHaveAttribute("title", "AI limited");
  });

  it("shows 'Sync issue' when the error mentions network", () => {
    intelligenceValue = { status: "error", error: "network request failed" };
    render(<SystemStatus />);
    expect(screen.getByRole("status")).toHaveAttribute("title", "Sync issue");
  });
});

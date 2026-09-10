import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/" }));
vi.mock("@/features/intelligence", () => ({
  IntelligencePanel: () => <div data-testid="module-intelligence-panel" />,
}));

import { LandingBrainExperience } from "./LandingBrainExperience";

describe("LandingBrainExperience", () => {
  it("keeps module exploration on-page and routes explicit open to existing auth flow", async () => {
    push.mockReset();
    render(<LandingBrainExperience />);

    await userEvent.click(screen.getByRole("button", { name: "Focus" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Focus" })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Open Focus" }));
    expect(push).toHaveBeenCalledWith("/register?module=focus");
  });
});

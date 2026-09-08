import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/hub" }));

import { BrainHub } from "./BrainHub";

describe("BrainHub", () => {
  it("exposes all six modules as reachable button controls", () => {
    render(<BrainHub />);
    const list = screen.getByRole("list", { name: "Mastery modules" });
    for (const label of ["Goals", "Plan", "Focus", "Act", "Grow", "Analytics"]) {
      expect(within(list).getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("navigates to the module route and activates its node on select", async () => {
    push.mockClear();
    render(<BrainHub />);
    const list = screen.getByRole("list", { name: "Mastery modules" });
    await userEvent.click(within(list).getByRole("button", { name: "Focus" }));
    expect(push).toHaveBeenCalledWith("/focus");
    expect(within(list).getByRole("button", { name: "Focus" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("lets a caller override selection instead of navigating (Layer B seam)", async () => {
    const onSelect = vi.fn();
    push.mockClear();
    render(<BrainHub onSelect={onSelect} />);
    const list = screen.getByRole("list", { name: "Mastery modules" });
    await userEvent.click(within(list).getByRole("button", { name: "Grow" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "grow", href: "/grow" }));
    expect(push).not.toHaveBeenCalled();
  });
});

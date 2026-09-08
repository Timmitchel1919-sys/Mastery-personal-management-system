import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/hub" }));

import { BrainHub } from "./BrainHub";

function moduleButton(name: string) {
  const list = screen.getByRole("list", { name: "Mastery modules" });
  return within(list).getByRole("button", { name });
}

describe("BrainHub", () => {
  it("exposes all six modules as reachable button controls", () => {
    render(<BrainHub />);
    for (const label of ["Goals", "Plan", "Focus", "Act", "Grow", "Analytics"]) {
      expect(moduleButton(label)).toBeInTheDocument();
    }
  });

  it("selecting a module enters it spatially without navigating away", async () => {
    push.mockClear();
    render(<BrainHub />);
    await userEvent.click(moduleButton("Focus"));

    // The spatial context appears; the app did not route.
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/Now in\s*Focus/i);
    expect(push).not.toHaveBeenCalled();

    // The camera settles into module-active.
    await waitFor(() => expect(status).not.toHaveTextContent(/settling/i));
  });

  it("only the explicit Open action navigates; Back returns to the brain", async () => {
    push.mockClear();
    render(<BrainHub />);
    await userEvent.click(moduleButton("Focus"));

    await userEvent.click(screen.getByRole("button", { name: /open focus/i }));
    expect(push).toHaveBeenCalledWith("/focus");

    await userEvent.click(screen.getByRole("button", { name: /back to brain/i }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("lets a caller override navigation with onOpen (Layer C seam)", async () => {
    const onOpen = vi.fn();
    push.mockClear();
    render(<BrainHub onOpen={onOpen} />);
    await userEvent.click(moduleButton("Grow"));
    await userEvent.click(screen.getByRole("button", { name: /open grow/i }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "grow" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("Escape returns toward the brain without leaving the app", async () => {
    push.mockClear();
    render(<BrainHub />);
    await userEvent.click(moduleButton("Act"));
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });
});

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/hub" }));
vi.mock("@/features/intelligence", () => ({
  IntelligencePanel: () => <div data-testid="module-intelligence-panel" />,
}));
vi.mock("@/features/command", () => ({
  ModuleContextStrip: () => <div data-testid="module-context-strip" />,
}));

import { BrainHub } from "./BrainHub";

function moduleButton(name: string) {
  const list = screen.getByRole("list", { name: "Mastery modules" });
  return within(list).getByRole("button", { name });
}

describe("BrainHub", () => {
  it("exposes all six modules as reachable button controls at home", () => {
    render(<BrainHub />);
    for (const label of ["Goals", "Plan", "Focus", "Act", "Grow", "Analytics"]) {
      expect(moduleButton(label)).toBeInTheDocument();
    }
  });

  it("selecting a module opens its environment with real submodule links, without routing", async () => {
    push.mockClear();
    render(<BrainHub />);
    await userEvent.click(moduleButton("Focus"));

    expect(await screen.findByRole("heading", { level: 2, name: "Focus" })).toBeInTheDocument();
    const link = await screen.findByRole("link", { name: "Open Deep Work" });
    expect(link).toHaveAttribute("href", "/focus/deep-work");
    expect(push).not.toHaveBeenCalled();
  });

  it("Back returns to the Brain Hub; only the explicit Open navigates", async () => {
    push.mockClear();
    render(<BrainHub />);
    await userEvent.click(moduleButton("Focus"));
    await screen.findByRole("heading", { level: 2, name: "Focus" });

    await userEvent.click(screen.getByRole("button", { name: "Open Focus" }));
    expect(push).toHaveBeenCalledWith("/focus");

    await userEvent.click(screen.getByRole("button", { name: /back to brain hub/i }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { level: 2, name: "Focus" })).not.toBeInTheDocument(),
    );
    expect(moduleButton("Focus")).toBeInTheDocument();
  });

  it("Escape returns from the environment toward the brain without leaving the app", async () => {
    push.mockClear();
    render(<BrainHub />);
    await userEvent.click(moduleButton("Act"));
    await screen.findByRole("heading", { level: 2, name: "Act" });

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(moduleButton("Act")).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it("lets a caller override navigation with onOpen (feature seam)", async () => {
    const onOpen = vi.fn();
    push.mockClear();
    render(<BrainHub onOpen={onOpen} />);
    await userEvent.click(moduleButton("Grow"));
    await userEvent.click(await screen.findByRole("button", { name: "Open Grow" }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "grow" }));
    expect(push).not.toHaveBeenCalled();
  });
});

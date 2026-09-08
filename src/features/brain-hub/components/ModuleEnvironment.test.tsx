import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModuleEnvironment } from "./ModuleEnvironment";

vi.mock("next/navigation", () => ({ usePathname: () => "/hub" }));

function setup(over: Partial<Parameters<typeof ModuleEnvironment>[0]> = {}) {
  const onBack = vi.fn();
  const onOpenModule = vi.fn();
  const onRetry = vi.fn();
  render(
    <ModuleEnvironment
      moduleId="focus"
      phase="module-active"
      onBack={onBack}
      onOpenModule={onOpenModule}
      onRetry={onRetry}
      {...over}
    />,
  );
  return { onBack, onOpenModule, onRetry };
}

describe("ModuleEnvironment", () => {
  it("shows the module header and its submodules as links into existing routes", () => {
    setup();
    expect(screen.getByRole("heading", { level: 2, name: "Focus" })).toBeInTheDocument();
    const deepWork = screen.getByRole("link", { name: "Open Deep Work" });
    expect(deepWork).toHaveAttribute("href", "/focus/deep-work");
    expect(screen.getByRole("link", { name: "Open Time Blocking" })).toHaveAttribute(
      "href",
      "/focus/time-blocking",
    );
  });

  it("has a keyboard-accessible Back control", async () => {
    const { onBack } = setup();
    const back = screen.getByRole("button", { name: /back to brain hub/i });
    back.focus();
    await userEvent.keyboard("{Enter}");
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("routes to the full module only via the explicit Open action", async () => {
    const { onOpenModule } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Open Focus" }));
    expect(onOpenModule).toHaveBeenCalledTimes(1);
  });

  it("shows a skeleton while the camera is settling", () => {
    setup({ phase: "transitioning" });
    expect(screen.queryByRole("link", { name: /open deep work/i })).not.toBeInTheDocument();
  });

  it("shows an error state with retry and Back still reachable", async () => {
    const { onRetry, onBack } = setup({ error: "boom" });
    expect(screen.getByText(/unable to load focus/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: /back to brain hub/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

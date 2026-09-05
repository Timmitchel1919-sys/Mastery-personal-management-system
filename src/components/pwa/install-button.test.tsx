import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InstallButton } from "./install-button";

describe("InstallButton", () => {
  it("renders nothing until the browser offers an install prompt", () => {
    render(<InstallButton label="Install Mastery" installedLabel="Installed" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the button after beforeinstallprompt and calls prompt() on click", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    render(<InstallButton label="Install Mastery" installedLabel="Installed" />);

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event("beforeinstallprompt"), {
          prompt,
          userChoice: Promise.resolve({ outcome: "dismissed" as const }),
        }),
      );
    });

    const button = await screen.findByRole("button", { name: /install mastery/i });
    await userEvent.click(button);
    expect(prompt).toHaveBeenCalledTimes(1);
  });
});

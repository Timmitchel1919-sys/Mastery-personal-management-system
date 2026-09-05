import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useInstallPrompt } from "./use-install-prompt";

function fireBeforeInstall() {
  const userChoice = Promise.resolve({ outcome: "accepted" as const });
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event("beforeinstallprompt"), { prompt, userChoice });
  window.dispatchEvent(event);
  return { prompt, userChoice };
}

describe("useInstallPrompt", () => {
  it("is not installable until the browser offers a prompt", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("captures beforeinstallprompt and drives the native prompt", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    let handles: ReturnType<typeof fireBeforeInstall>;
    act(() => {
      handles = fireBeforeInstall();
    });
    expect(result.current.canInstall).toBe(true);

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });
    expect(handles!.prompt).toHaveBeenCalledTimes(1);
    expect(outcome).toBe("accepted");
    // consumed — no longer installable
    expect(result.current.canInstall).toBe(false);
  });

  it("reports 'unavailable' when there is no deferred prompt", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    await expect(result.current.promptInstall()).resolves.toBe("unavailable");
  });
});

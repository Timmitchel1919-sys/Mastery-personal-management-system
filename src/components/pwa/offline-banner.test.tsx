import { render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OfflineBanner } from "./offline-banner";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value });
  window.dispatchEvent(new Event(value ? "online" : "offline"));
}

afterEach(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
});

describe("OfflineBanner", () => {
  it("renders nothing while online and a status bar while offline", () => {
    const { rerender } = render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => setOnline(false));
    rerender(<OfflineBanner />);
    expect(screen.getByRole("status")).toHaveTextContent(/offline/i);

    act(() => setOnline(true));
    rerender(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

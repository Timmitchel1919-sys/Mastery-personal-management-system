import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lock = vi.fn();

vi.mock("next/navigation", () => ({ usePathname: () => "/recovery" }));
vi.mock("../use-recovery-lock", () => ({ useRecoveryLock: () => ({ lock }) }));

import { RecoveryHomeView } from "./RecoveryHomeView";

beforeEach(() => {
  lock.mockReset();
});

describe("RecoveryHomeView", () => {
  it("shows the privacy assurances and upcoming sublayers", () => {
    render(<RecoveryHomeView />);
    expect(
      screen.getByText("Kept out of your dashboard, global search, and ordinary notifications."),
    ).toBeInTheDocument();
    expect(screen.getByText("Recovery Coach")).toBeInTheDocument();
  });

  it("locks the module when Lock is clicked", async () => {
    render(<RecoveryHomeView />);
    await userEvent.click(screen.getByRole("button", { name: /lock/i }));
    expect(lock).toHaveBeenCalledTimes(1);
  });
});

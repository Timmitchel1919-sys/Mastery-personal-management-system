import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setup = vi.fn();
const unlock = vi.fn();
const lock = vi.fn();
const reset = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/recovery" }));
vi.mock("../use-recovery-lock", () => ({ useRecoveryLock: () => hookValue }));

import { RecoveryGate } from "./RecoveryGate";

beforeEach(() => {
  [setup, unlock, lock, reset].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    error: null,
    hasPin: false,
    unlocked: false,
    busy: false,
    pinError: null,
    setup,
    unlock,
    lock,
    reset,
  };
});

describe("RecoveryGate", () => {
  it("shows PIN setup when no PIN exists yet", () => {
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    expect(screen.getByText("Protect the Recovery Center")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("submits a matching PIN pair to setup", async () => {
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    await userEvent.type(screen.getByLabelText("PIN"), "1234");
    await userEvent.type(screen.getByLabelText("Confirm PIN"), "1234");
    await userEvent.click(screen.getByRole("button", { name: /set pin/i }));
    expect(setup).toHaveBeenCalledWith("1234");
  });

  it("shows PIN entry when a PIN already exists and is locked", () => {
    hookValue.hasPin = true;
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    expect(screen.getByText("Recovery Center is locked")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("submits a PIN to unlock", async () => {
    hookValue.hasPin = true;
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    await userEvent.type(screen.getByLabelText("PIN"), "5678");
    await userEvent.click(screen.getByRole("button", { name: /unlock/i }));
    expect(unlock).toHaveBeenCalledWith("5678");
  });

  it("resets the PIN after confirming", async () => {
    hookValue.hasPin = true;
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    await userEvent.click(screen.getByRole("button", { name: /forgot your pin/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^reset pin$/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renders children once unlocked, with no gate UI", () => {
    hookValue.unlocked = true;
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    expect(screen.getByText("Secret content")).toBeInTheDocument();
    expect(screen.queryByText("Recovery Center is locked")).not.toBeInTheDocument();
  });

  it("renders an error state", () => {
    hookValue = { ...hookValue, status: "error", error: "boom" };
    render(
      <RecoveryGate>
        <div>Secret content</div>
      </RecoveryGate>,
    );
    expect(screen.getByText("We couldn't open the Recovery Center")).toBeInTheDocument();
  });
});

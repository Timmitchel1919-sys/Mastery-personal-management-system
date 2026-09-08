import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProposedAction } from "../action-model";
import { ActionPreviewCard } from "./ActionPreviewCard";

vi.mock("next/navigation", () => ({ usePathname: () => "/act/tasks" }));

function makeAction(over: Partial<ProposedAction> = {}): ProposedAction {
  return {
    id: "a1",
    kind: "reschedule-task",
    title: 'Move "Finalise docs" to tomorrow',
    reason: "Your completion rate is stronger in the morning.",
    risk: "medium",
    source: "ai",
    preview: [{ label: "Due", from: "Today", to: "Tomorrow" }],
    execute: vi.fn(async () => {}),
    ...over,
  };
}

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
});

describe("ActionPreviewCard", () => {
  it("shows the proposed change and applies it only on approval", async () => {
    const execute = vi.fn(async () => {});
    render(<ActionPreviewCard action={makeAction({ execute })} />);

    expect(screen.getByText('Move "Finalise docs" to tomorrow')).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("Changes your plan")).toBeInTheDocument();
    expect(execute).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /apply change/i }));
    expect(execute).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Change applied")).toBeInTheDocument();
  });

  it("surfaces a failure with retry when execute rejects", async () => {
    const execute = vi.fn(async () => {
      throw new Error("network");
    });
    render(<ActionPreviewCard action={makeAction({ execute })} />);

    await userEvent.click(screen.getByRole("button", { name: /apply change/i }));
    expect(await screen.findByText("Change not applied")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("blocks a stale recommendation and offers refresh", async () => {
    const onRefresh = vi.fn();
    render(
      <ActionPreviewCard
        action={makeAction({ targetSignature: "v1" })}
        currentSignature="v2"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText("This recommendation is no longer current")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /apply change/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("runs validate first and does not execute when it fails", async () => {
    const execute = vi.fn(async () => {});
    render(
      <ActionPreviewCard
        action={makeAction({
          execute,
          validate: () => ({ ok: false, issues: [{ code: "conflict", message: "That slot is taken." }] }),
        })}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /apply change/i }));
    expect(await screen.findByText("That slot is taken.")).toBeInTheDocument();
    expect(execute).not.toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { brainModule } from "../brain-navigation";
import { BrainNode } from "./BrainNode";

const focus = brainModule("focus");

function setup(selected = false) {
  const onSelect = vi.fn();
  const onActivate = vi.fn();
  const onDeactivate = vi.fn();
  render(
    <BrainNode
      module={focus}
      selected={selected}
      radius={40}
      onSelect={onSelect}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
    />,
  );
  return { onSelect, onActivate, onDeactivate };
}

describe("BrainNode", () => {
  it("is a semantic button with an accessible name", () => {
    setup();
    expect(screen.getByRole("button", { name: "Focus module" })).toBeInTheDocument();
  });

  it("selects on click and reports hover / focus activation", async () => {
    const { onSelect, onActivate, onDeactivate } = setup();
    const button = screen.getByRole("button", { name: "Focus module" });

    await userEvent.hover(button);
    expect(onActivate).toHaveBeenCalled();
    await userEvent.unhover(button);
    expect(onDeactivate).toHaveBeenCalled();

    onActivate.mockClear();
    onDeactivate.mockClear();
    button.focus();
    expect(onActivate).toHaveBeenCalledTimes(1);
    button.blur();
    expect(onDeactivate).toHaveBeenCalledTimes(1);

    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marks the selected state for assistive tech and styling", () => {
    setup(true);
    const button = screen.getByRole("button", { name: "Focus module" });
    expect(button).toHaveAttribute("data-selected", "true");
    expect(button).toHaveAttribute("aria-current", "true");
  });
});

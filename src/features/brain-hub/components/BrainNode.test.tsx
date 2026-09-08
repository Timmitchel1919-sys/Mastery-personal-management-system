import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { brainModule } from "../brain-navigation";
import { BrainNode } from "./BrainNode";

const focus = brainModule("focus");

function setup(props: Partial<Parameters<typeof BrainNode>[0]> = {}) {
  const onSelect = vi.fn();
  const onActivate = vi.fn();
  const onDeactivate = vi.fn();
  render(
    <BrainNode
      module={focus}
      selected={false}
      radius={40}
      onSelect={onSelect}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
      {...props}
    />,
  );
  return { onSelect, onActivate, onDeactivate };
}

describe("BrainNode", () => {
  it("is a semantic button with an accessible name", () => {
    setup();
    expect(screen.getByRole("button", { name: "Open Focus" })).toBeInTheDocument();
  });

  it("selects on click and reports hover / focus activation", async () => {
    const { onSelect, onActivate, onDeactivate } = setup();
    const button = screen.getByRole("button", { name: "Open Focus" });

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

  it("marks the selected state and steps back when dimmed", () => {
    const { onSelect } = setup({ selected: true, dimmed: true });
    const button = screen.getByRole("button", { name: "Open Focus" });
    expect(button).toHaveAttribute("data-selected", "true");
    expect(button).toHaveAttribute("aria-current", "true");
    expect(button.className).toContain("brain-node--dimmed");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a status indicator with a text label, only for real non-normal status", () => {
    setup({ status: "attention" });
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
  });

  it("renders no status indicator for normal / missing status", () => {
    setup({ status: "normal" });
    expect(screen.queryByText(/needs attention|active now/i)).not.toBeInTheDocument();
  });

  it("associates a preview with the node only while it is open", () => {
    setup({ previewId: "preview-focus", previewOpen: true });
    expect(screen.getByRole("button", { name: "Open Focus" })).toHaveAttribute(
      "aria-describedby",
      "preview-focus",
    );
  });
});

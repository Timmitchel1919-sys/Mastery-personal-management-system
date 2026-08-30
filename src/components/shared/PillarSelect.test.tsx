import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PillarSelect } from "./PillarSelect";

describe("PillarSelect", () => {
  it("adds a pillar in canonical order", async () => {
    const onChange = vi.fn();
    render(<PillarSelect value={["personal"]} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Spiritual"));
    expect(onChange).toHaveBeenCalledWith(["spiritual", "personal"]);
  });

  it("removes a pillar when unchecked", async () => {
    const onChange = vi.fn();
    render(<PillarSelect value={["spiritual", "personal"]} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Spiritual"));
    expect(onChange).toHaveBeenCalledWith(["personal"]);
  });

  it("reflects the current value", () => {
    render(<PillarSelect value={["societal"]} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Societal")).toBeChecked();
    expect(screen.getByLabelText("Personal")).not.toBeChecked();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryCopingAction } from "../recovery-coping-schema";

const addSuggestion = vi.fn();
const addCopingAction = vi.fn();
const removeCopingAction = vi.fn();
const reload = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("../use-recovery-coping", () => ({ useRecoveryCoping: () => hookValue }));

import { CopingToolkitSection } from "./CopingToolkitSection";

const action: RecoveryCopingAction = {
  id: "a1",
  status: "active",
  version: 1,
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
  title: "Box breathing",
  category: "physical",
  howTo: "In for 4, hold 4, out 4, hold 4.",
};

beforeEach(() => {
  [addSuggestion, addCopingAction, removeCopingAction, reload].forEach((fn) => fn.mockReset());
  hookValue = {
    status: "ready",
    items: [],
    error: null,
    reload,
    addCopingAction,
    addSuggestion,
    editCopingAction: vi.fn(),
    removeCopingAction,
    saving: false,
  };
});

describe("CopingToolkitSection", () => {
  it("shows the empty state and quick-add suggestions", () => {
    render(<CopingToolkitSection goalId="g1" faithBased={false} />);
    expect(screen.getByRole("heading", { name: "Coping toolkit" })).toBeInTheDocument();
    expect(
      screen.getByText(/Nothing here yet\. Add your own, or start from a suggestion/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Urge surfing/ })).toBeInTheDocument();
  });

  it("hides faith-based suggestions unless the goal opts in", () => {
    const { rerender } = render(<CopingToolkitSection goalId="g1" faithBased={false} />);
    expect(screen.queryByRole("button", { name: /Gratitude list/ })).not.toBeInTheDocument();
    rerender(<CopingToolkitSection goalId="g1" faithBased={true} />);
    expect(screen.getByRole("button", { name: /Gratitude list/ })).toBeInTheDocument();
  });

  it("adds a suggestion via its quick-add chip", async () => {
    render(<CopingToolkitSection goalId="g1" faithBased={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Box breathing/ }));
    expect(addSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Box breathing", category: "physical" }),
    );
  });

  it("lists saved actions, drops them from quick-add, and removes on click", async () => {
    hookValue.items = [action];
    render(<CopingToolkitSection goalId="g1" faithBased={false} />);
    expect(screen.getByText("In for 4, hold 4, out 4, hold 4.")).toBeInTheDocument();
    // "Box breathing" is now saved, so it's no longer offered as a quick-add chip
    expect(screen.queryByRole("button", { name: /^Box breathing$/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove Box breathing" }));
    expect(removeCopingAction).toHaveBeenCalledWith("a1");
  });

  it("shows an error state with retry", async () => {
    hookValue.status = "error";
    hookValue.error = "nope";
    render(<CopingToolkitSection goalId="g1" faithBased={false} />);
    expect(screen.getByText("We couldn't load your toolkit")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

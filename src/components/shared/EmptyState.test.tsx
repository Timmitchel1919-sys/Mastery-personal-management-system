import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(<EmptyState title="Nothing here yet" description="Add your first item." />);
    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
    expect(screen.getByText("Add your first item.")).toBeInTheDocument();
  });

  it("renders an action when provided", () => {
    render(<EmptyState title="Empty" action={<button type="button">Create</button>} />);
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("omits the description paragraph when not provided", () => {
    const { container } = render(<EmptyState title="Only a title" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

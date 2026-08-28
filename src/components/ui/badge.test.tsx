import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies the variant class", () => {
    render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText("Done").className).toContain("text-success");
  });
});

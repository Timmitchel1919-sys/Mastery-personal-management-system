import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline";

describe("Sparkline", () => {
  it("renders nothing for an empty series", () => {
    const { container } = render(<Sparkline points={[]} ariaLabel="Empty" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an accessible image with a path for its points", () => {
    render(
      <Sparkline
        points={[
          { date: "2026-09-01", value: 1 },
          { date: "2026-09-02", value: 5 },
        ]}
        ariaLabel="Test trend"
      />,
    );
    const svg = screen.getByRole("img", { name: "Test trend" });
    expect(svg.querySelector("path")).toBeInTheDocument();
  });

  it("draws a dashed target line when a target value is given", () => {
    render(
      <Sparkline
        points={[
          { date: "2026-09-01", value: 1 },
          { date: "2026-09-02", value: 5 },
        ]}
        targetValue={3}
        ariaLabel="Test trend"
      />,
    );
    const svg = screen.getByRole("img", { name: "Test trend" });
    expect(svg.querySelector("line")).toBeInTheDocument();
  });
});

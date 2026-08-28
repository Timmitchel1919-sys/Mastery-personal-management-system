import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./field";
import { Input } from "./input";

describe("FormField", () => {
  it("associates the label with the control", () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("wires the description into aria-describedby", () => {
    render(
      <FormField label="Name" description="Your full name">
        <Input />
      </FormField>,
    );
    const control = screen.getByLabelText("Name");
    const description = screen.getByText("Your full name");
    expect(control.getAttribute("aria-describedby")).toContain(description.id);
    expect(control).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and links the error text", () => {
    render(
      <FormField label="Age" error="Must be a number">
        <Input />
      </FormField>,
    );
    const control = screen.getByLabelText("Age");
    const error = screen.getByText("Must be a number");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control.getAttribute("aria-describedby")).toContain(error.id);
  });
});

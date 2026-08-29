import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "./breadcrumb-trail";

describe("buildBreadcrumbs", () => {
  it("renders the dashboard as a single current crumb", () => {
    expect(buildBreadcrumbs("/dashboard")).toEqual([{ label: "Dashboard" }]);
  });

  it("prefixes Dashboard and links the parent section", () => {
    expect(buildBreadcrumbs("/plan/goals")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Plan", href: "/plan" },
      { label: "Goals" },
    ]);
  });

  it("title-cases segments that are not in the nav config", () => {
    expect(buildBreadcrumbs("/plan/some-thing")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Plan", href: "/plan" },
      { label: "Some Thing" },
    ]);
  });

  it("handles a single top-level system route", () => {
    expect(buildBreadcrumbs("/settings")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Settings" },
    ]);
  });

  it("falls back for the root path", () => {
    expect(buildBreadcrumbs("/")).toEqual([{ label: "Dashboard" }]);
  });
});

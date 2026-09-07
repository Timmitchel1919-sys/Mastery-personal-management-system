import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "./breadcrumb-trail";

describe("buildBreadcrumbs", () => {
  it("returns only the current page's label — no Dashboard prefix, no trail", () => {
    expect(buildBreadcrumbs("/plan/goals")).toEqual([{ label: "Goals" }]);
    expect(buildBreadcrumbs("/settings")).toEqual([{ label: "Settings" }]);
    expect(buildBreadcrumbs("/dashboard")).toEqual([{ label: "Dashboard" }]);
  });

  it("title-cases a segment that is not in the nav config", () => {
    expect(buildBreadcrumbs("/plan/some-thing")).toEqual([{ label: "Some Thing" }]);
  });

  it("falls back for the root path", () => {
    expect(buildBreadcrumbs("/")).toEqual([{ label: "Dashboard" }]);
  });
});

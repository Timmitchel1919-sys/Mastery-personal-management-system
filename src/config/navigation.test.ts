import { describe, expect, it } from "vitest";
import {
  ALL_NAV_ITEMS,
  BOTTOM_NAV_ITEMS,
  DASHBOARD_ITEM,
  NAV_SECTIONS,
  SYSTEM_ITEMS,
  isNavItemActive,
  navLabelForHref,
} from "./navigation";

describe("navigation config", () => {
  it("uses unique absolute hrefs everywhere", () => {
    const hrefs = ALL_NAV_ITEMS.map((item) => item.href);
    expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("gives every item a label and an icon", () => {
    for (const item of ALL_NAV_ITEMS) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.icon).toBeTruthy();
    }
  });

  it("exposes the five loop entry points as the bottom nav", () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/dashboard",
      "/plan",
      "/focus",
      "/act",
      "/grow",
    ]);
  });

  it("keeps the private section and analytics out of the bottom nav", () => {
    const hrefs = BOTTOM_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).not.toContain("/recovery");
    expect(hrefs).not.toContain("/analytics");
  });

  it("marks the private section", () => {
    expect(NAV_SECTIONS.find((section) => section.id === "private")?.private).toBe(true);
  });

  it("includes dashboard and system items in the flattened list", () => {
    expect(ALL_NAV_ITEMS).toContain(DASHBOARD_ITEM);
    for (const item of SYSTEM_ITEMS) {
      expect(ALL_NAV_ITEMS).toContain(item);
    }
  });

  it("resolves labels by href", () => {
    expect(navLabelForHref("/plan")).toBe("Plan");
    expect(navLabelForHref("/plan/goals")).toBe("Goals");
    expect(navLabelForHref("/settings")).toBe("Settings");
    expect(navLabelForHref("/unknown")).toBeUndefined();
  });
});

describe("isNavItemActive", () => {
  it("matches exact and descendant paths", () => {
    expect(isNavItemActive("/plan/goals", "/plan/goals")).toBe(true);
    expect(isNavItemActive("/plan/goals/g1", "/plan/goals")).toBe(true);
    expect(isNavItemActive("/plan", "/plan/goals")).toBe(false);
    expect(isNavItemActive("/plans", "/plan")).toBe(false);
  });

  it("only activates dashboard on an exact match", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard/anything", "/dashboard")).toBe(false);
  });
});

"use client";

import { usePathname } from "next/navigation";
import { navLabelForHref } from "@/config/navigation";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

function titleCase(segment: string): string {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * The current page's own label — no "Dashboard ›" prefix and no parent trail. The
 * module name shown in the panel header (the `<h1>`) is the single wayfinding cue, so
 * the breadcrumb collapses to just the leaf and `BreadcrumbTrail` renders nothing.
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Dashboard" }];
  const acc = `/${segments.join("/")}`;
  const leaf = segments[segments.length - 1] ?? "";
  return [{ label: navLabelForHref(acc) ?? titleCase(leaf) }];
}

export function BreadcrumbTrail({ className }: { className?: string }) {
  const pathname = usePathname();
  const items = buildBreadcrumbs(pathname);
  // A single leaf crumb duplicates the panel <h1>; don't render it.
  if (items.length <= 1) return null;
  return <Breadcrumbs items={items} className={className} />;
}

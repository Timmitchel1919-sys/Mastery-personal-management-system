"use client";

import { usePathname } from "next/navigation";
import { navLabelForHref } from "@/config/navigation";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

function titleCase(segment: string): string {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Derive a breadcrumb trail from a pathname using the navigation config for labels. */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Dashboard" }];

  const crumbs: BreadcrumbItem[] = [];
  if (segments[0] !== "dashboard") {
    crumbs.push({ label: "Dashboard", href: "/dashboard" });
  }

  let acc = "";
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    const label = navLabelForHref(acc) ?? titleCase(segment);
    const isLast = index === segments.length - 1;
    crumbs.push(isLast ? { label } : { label, href: acc });
  });

  return crumbs;
}

export function BreadcrumbTrail({ className }: { className?: string }) {
  const pathname = usePathname();
  const items = buildBreadcrumbs(pathname);
  if (items.length <= 1) return null;
  return <Breadcrumbs items={items} className={className} />;
}

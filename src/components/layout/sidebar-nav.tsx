"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  DASHBOARD_ITEM,
  NAV_SECTIONS,
  SYSTEM_ITEMS,
  isNavItemActive,
  navMessageKey,
  navSectionMessageKey,
  type NavItem,
  type NavSection,
} from "@/config/navigation";
import { Separator, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function NavLink({
  item,
  label,
  active,
  collapsed,
  onNavigate,
}: {
  item: Pick<NavItem, "href" | "icon">;
  label: string;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none",
        "focus-visible:ring-ring focus-visible:ring-2",
        active ? "bg-surface text-foreground" : "text-muted hover:bg-surface hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** A leaf link inside an expanded section's dropdown — a short tick connects it to the
 * section's vertical tree line instead of repeating an icon for every row. */
function TreeLink({
  item,
  label,
  active,
  onNavigate,
}: {
  item: Pick<NavItem, "href">;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="relative flex items-center pl-4">
      <span aria-hidden="true" className="bg-border absolute top-1/2 left-0 h-px w-4" />
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-8 min-w-0 flex-1 items-center rounded-md px-2 text-sm transition-colors outline-none",
          "focus-visible:ring-ring focus-visible:ring-2",
          active
            ? "bg-surface text-foreground font-medium"
            : "text-muted hover:bg-surface hover:text-foreground",
        )}
      >
        <span className="truncate">{label}</span>
      </Link>
    </div>
  );
}

/** Whether the pathname is on this section's overview page or one of its items. */
function isSectionActive(section: NavSection, pathname: string): boolean {
  return isNavItemActive(pathname, section.href);
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  // Sections default open when the current route is inside them; an explicit toggle
  // (in either direction) overrides that default until the page reloads.
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>({});

  const label = (href: string, fallback: string) => {
    const key = navMessageKey(href);
    return t.has(key) ? t(key) : fallback;
  };

  const isOpen = (section: NavSection) =>
    openOverrides[section.id] ?? isSectionActive(section, pathname);

  const toggleSection = (section: NavSection) => {
    setOpenOverrides((prev) => ({ ...prev, [section.id]: !isOpen(section) }));
  };

  return (
    <nav aria-label={t("nav.primary")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      <NavLink
        item={DASHBOARD_ITEM}
        label={label(DASHBOARD_ITEM.href, DASHBOARD_ITEM.label)}
        active={isNavItemActive(pathname, DASHBOARD_ITEM.href)}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      {NAV_SECTIONS.map((section) => {
        const sectionKey = navSectionMessageKey(section.id);
        const sectionLabel = t.has(sectionKey) ? t(sectionKey) : section.label;
        const Icon = section.icon;

        // Collapsed rail (icon-only): unchanged flat list, no room for a dropdown tree.
        if (collapsed) {
          return (
            <div key={section.id} className={cn("mt-4", section.private && "mt-6")}>
              <Separator className="my-2" />
              <div className="flex flex-col gap-0.5">
                {!section.private ? (
                  <NavLink
                    item={{ href: section.href, icon: section.icon }}
                    label={`${label(section.href, section.label)} ${t("nav.overviewSuffix")}`}
                    active={pathname === section.href}
                    collapsed
                    onNavigate={onNavigate}
                  />
                ) : null}
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    label={label(item.href, item.label)}
                    active={isNavItemActive(pathname, item.href)}
                    collapsed
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        }

        // Recovery Center: always one direct link, never behind an extra click
        // (docs/RECOVERY_PRIVACY.md — visible, not obscured; still visually separated).
        if (section.private) {
          return (
            <div key={section.id} className="border-border mt-6 border-t pt-4">
              <p className="text-subtle px-3 pb-1 text-xs font-medium tracking-wide uppercase">
                {sectionLabel}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    label={label(item.href, item.label)}
                    active={isNavItemActive(pathname, item.href)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        }

        const open = isOpen(section);
        const panelId = `nav-section-${section.id}`;
        return (
          <div key={section.id} className="mt-1">
            <button
              type="button"
              onClick={() => toggleSection(section)}
              aria-expanded={open}
              aria-controls={panelId}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none",
                "text-muted hover:bg-surface hover:text-foreground focus-visible:ring-ring focus-visible:ring-2",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate text-left">{sectionLabel}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </button>

            {open ? (
              <div
                id={panelId}
                className="border-border relative mt-0.5  flex flex-col gap-0.5 border-l py-0.5"
              >
                <TreeLink
                  item={{ href: section.href }}
                  label={`${label(section.href, section.label)} ${t("nav.overviewSuffix")}`}
                  active={pathname === section.href}
                  onNavigate={onNavigate}
                />
                {section.items.map((item) => (
                  <TreeLink
                    key={item.href}
                    item={item}
                    label={label(item.href, item.label)}
                    active={isNavItemActive(pathname, item.href)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="border-border mt-6 flex flex-col gap-0.5 border-t pt-4">
        {SYSTEM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            label={label(item.href, item.label)}
            active={isNavItemActive(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

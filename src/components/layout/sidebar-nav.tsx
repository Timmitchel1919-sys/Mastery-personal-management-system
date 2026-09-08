"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  BRAIN_HUB_ITEM,
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

/** The icon-and-label row shared by the module-card headers and the standalone cards
 * (Dashboard / Recovery / Settings), so every card in the sidebar reads the same. */
function NavCardLink({
  item,
  label,
  active,
  onNavigate,
}: {
  item: Pick<NavItem, "href" | "icon">;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-lg px-1.5 text-sm transition-colors outline-none",
        "focus-visible:ring-ring focus-visible:ring-2",
        active ? "text-foreground font-semibold" : "text-muted hover:text-foreground font-medium",
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
          active ? "bg-primary/15 text-primary" : "bg-gold-subtle text-accent",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex-1 truncate text-left tracking-tight">{label}</span>
    </Link>
  );
}

/** The gold left indicator on an active card — an extra, non-colour cue on top of the
 * elevated surface, gold icon chip, and heavier text. */
function ActiveRail() {
  return (
    <span
      aria-hidden="true"
      className="bg-gold absolute top-2 bottom-2 left-0 w-0.5 rounded-full"
    />
  );
}

/** A card wrapper matching the module cards, for a link (or small group of links) that
 * doesn't expand. */
function NavCard({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="mastery-nav-card relative px-1.5 py-1.5" data-active={active}>
      {active ? <ActiveRail /> : null}
      {children}
    </div>
  );
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

/** A leaf link inside an expanded module card. A short gold tick connects it to the
 * card's vertical connector line; the active child gets a soft champagne background and
 * a gold left indicator. */
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
      <span aria-hidden="true" className="bg-gold-connector absolute top-1/2 left-0 h-px w-3.5" />
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-8 min-w-0 flex-1 items-center rounded-md px-2.5 text-[0.8125rem] transition-colors outline-none",
          "focus-visible:ring-ring focus-visible:ring-2",
          active
            ? "bg-selected text-foreground font-medium"
            : "text-muted hover:bg-selected/60 hover:text-foreground",
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="bg-gold absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full"
          />
        ) : null}
        <span className="truncate">{label}</span>
      </Link>
    </div>
  );
}

/** Whether the current route belongs to this section — its own landing page exactly, or
 * one of its submodules (and their children). Matching items (not the broad section
 * prefix) keeps sibling modules that share a URL prefix — e.g. Plan `/plan` vs Goals
 * `/plan/goals` — from both lighting up. */
function isSectionActive(section: NavSection, pathname: string): boolean {
  if (pathname === section.href) return true;
  return section.items.some((item) => isNavItemActive(pathname, item.href));
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

  // The Notifications item is retired from the sidebar (reachable from Settings).
  const systemItems = SYSTEM_ITEMS.filter((item) => item.href !== "/notifications");
  const dashboardActive = isNavItemActive(pathname, DASHBOARD_ITEM.href);
  const brainHubActive = isNavItemActive(pathname, BRAIN_HUB_ITEM.href);

  return (
    <nav aria-label={t("nav.primary")} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
      {collapsed ? (
        <NavLink
          item={DASHBOARD_ITEM}
          label={label(DASHBOARD_ITEM.href, DASHBOARD_ITEM.label)}
          active={dashboardActive}
          collapsed
          onNavigate={onNavigate}
        />
      ) : (
        <NavCard active={dashboardActive}>
          <NavCardLink
            item={DASHBOARD_ITEM}
            label={label(DASHBOARD_ITEM.href, DASHBOARD_ITEM.label)}
            active={dashboardActive}
            onNavigate={onNavigate}
          />
        </NavCard>
      )}

      {collapsed ? (
        <NavLink
          item={BRAIN_HUB_ITEM}
          label={label(BRAIN_HUB_ITEM.href, BRAIN_HUB_ITEM.label)}
          active={brainHubActive}
          collapsed
          onNavigate={onNavigate}
        />
      ) : (
        <NavCard active={brainHubActive}>
          <NavCardLink
            item={BRAIN_HUB_ITEM}
            label={label(BRAIN_HUB_ITEM.href, BRAIN_HUB_ITEM.label)}
            active={brainHubActive}
            onNavigate={onNavigate}
          />
        </NavCard>
      )}

      {NAV_SECTIONS.map((section) => {
        const sectionKey = navSectionMessageKey(section.id);
        const sectionLabel = t.has(sectionKey) ? t(sectionKey) : section.label;
        const Icon = section.icon;

        // Collapsed rail (icon-only): flat list, no room for module cards or a tree.
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

        // Recovery Center: a plain card (no divider line above it), one direct link per
        // item — never behind an extra click (docs/RECOVERY_PRIVACY.md: visible, not
        // obscured; still visually set apart by the "Private" label).
        if (section.private) {
          return (
            <NavCard key={section.id} active={isSectionActive(section, pathname)}>
              <p className="text-subtle px-1.5 pt-0.5 pb-1 text-[0.65rem] font-medium tracking-wide uppercase">
                {sectionLabel}
              </p>
              {section.items.map((item) => (
                <NavCardLink
                  key={item.href}
                  item={item}
                  label={label(item.href, item.label)}
                  active={isNavItemActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </NavCard>
          );
        }

        const open = isOpen(section);
        const active = isSectionActive(section, pathname);
        const panelId = `nav-section-${section.id}`;
        return (
          <div
            key={section.id}
            className="mastery-nav-card relative px-1.5 py-1.5"
            data-active={active}
          >
            {active ? <ActiveRail /> : null}
            <button
              type="button"
              onClick={() => toggleSection(section)}
              aria-expanded={open}
              aria-controls={panelId}
              className={cn(
                "flex h-9 w-full items-center gap-2.5 rounded-lg px-1.5 text-sm transition-colors outline-none",
                "focus-visible:ring-ring focus-visible:ring-2",
                active
                  ? "text-foreground font-semibold"
                  : "text-muted hover:text-foreground font-medium",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
                  active ? "bg-primary/15 text-primary" : "bg-gold-subtle text-accent",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="flex-1 truncate text-left tracking-tight">{sectionLabel}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "text-subtle size-4 shrink-0 transition-transform duration-200 ease-out",
                  open && "rotate-180",
                )}
              />
            </button>

            {open ? (
              <div
                id={panelId}
                className="mastery-expand border-gold-connector relative mt-1 ml-3.5 flex flex-col gap-0.5 border-l pt-0.5 pb-0.5 pl-0"
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

      {collapsed ? (
        <div className="mt-4 flex flex-col gap-0.5">
          {systemItems.map((item) => (
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
      ) : (
        systemItems.map((item) => (
          <NavCard key={item.href} active={isNavItemActive(pathname, item.href)}>
            <NavCardLink
              item={item}
              label={label(item.href, item.label)}
              active={isNavItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          </NavCard>
        ))
      )}
    </nav>
  );
}

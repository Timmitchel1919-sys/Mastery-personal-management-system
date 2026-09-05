"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DASHBOARD_ITEM,
  NAV_SECTIONS,
  SYSTEM_ITEMS,
  isNavItemActive,
  navMessageKey,
  navSectionMessageKey,
  type NavItem,
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

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const label = (href: string, fallback: string) => {
    const key = navMessageKey(href);
    return t.has(key) ? t(key) : fallback;
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
        return (
          <div
            key={section.id}
            className={cn("mt-4", section.private && "border-border mt-6 border-t pt-4")}
          >
            {!collapsed ? (
              <p className="text-subtle px-3 pb-1 text-xs font-medium tracking-wide uppercase">
                {sectionLabel}
              </p>
            ) : (
              <Separator className="my-2" />
            )}
            <div className="flex flex-col gap-0.5">
              {!section.private ? (
                <NavLink
                  item={{ href: section.href, icon: section.icon }}
                  label={`${label(section.href, section.label)} ${t("nav.overviewSuffix")}`}
                  active={pathname === section.href}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ) : null}
              {section.items.map((item) => (
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

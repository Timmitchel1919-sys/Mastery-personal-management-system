"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_ITEM,
  NAV_SECTIONS,
  SYSTEM_ITEMS,
  isNavItemActive,
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
  active,
  collapsed,
  onNavigate,
}: {
  item: Pick<NavItem, "label" | "href" | "icon">;
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
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      <NavLink
        item={DASHBOARD_ITEM}
        active={isNavItemActive(pathname, DASHBOARD_ITEM.href)}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      {NAV_SECTIONS.map((section) => (
        <div
          key={section.id}
          className={cn("mt-4", section.private && "border-border mt-6 border-t pt-4")}
        >
          {!collapsed ? (
            <p className="text-subtle px-3 pb-1 text-xs font-medium tracking-wide uppercase">
              {section.label}
            </p>
          ) : (
            <Separator className="my-2" />
          )}
          <div className="flex flex-col gap-0.5">
            {!section.private ? (
              <NavLink
                item={{
                  label: `${section.label} overview`,
                  href: section.href,
                  icon: section.icon,
                }}
                active={pathname === section.href}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="border-border mt-6 flex flex-col gap-0.5 border-t pt-4">
        {SYSTEM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isNavItemActive(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

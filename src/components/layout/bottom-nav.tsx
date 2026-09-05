"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BOTTOM_NAV_ITEMS, isNavItemActive, navMessageKey } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Fixed bottom navigation for mobile (< lg): the five Plan→Grow loop entry points. */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      aria-label={t("nav.primary")}
      className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);
        const key = navMessageKey(item.href);
        const label = t.has(key) ? t(key) : item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[0.6875rem] font-medium outline-none",
              "focus-visible:ring-ring focus-visible:ring-inset focus-visible:ring-2",
              active ? "text-primary" : "text-muted",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

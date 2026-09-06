"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { Card } from "@/components/ui";
import { NAV_SECTIONS, navMessageKey, navSectionMessageKey } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Landing page for a nav section: a grid of links to its module routes. */
export function SectionLanding({ sectionId }: { sectionId: string }) {
  const t = useTranslations();
  const section = NAV_SECTIONS.find((entry) => entry.id === sectionId);
  if (!section) return null;

  const sectionKey = navSectionMessageKey(section.id);
  const sectionLabel = t.has(sectionKey) ? t(sectionKey) : section.label;

  return (
    <PageContainer size="wide">
      <PageHeader
        title={sectionLabel}
        description={t("chrome.sectionOverview", { section: sectionLabel.toLowerCase() })}
        breadcrumbs={<BreadcrumbTrail />}
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => {
          const Icon = item.icon;
          const itemKey = navMessageKey(item.href);
          const itemLabel = t.has(itemKey) ? t(itemKey) : item.label;
          return (
            <Card key={item.href} className="transition-colors hover:border-border-strong">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-4 outline-none",
                  "focus-visible:ring-ring rounded-lg focus-visible:ring-2",
                )}
              >
                <span className="bg-surface text-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{itemLabel}</span>
                  {item.plannedLayer ? (
                    <span className="text-subtle block text-xs">
                      {t("chrome.plannedLayer", { layer: item.plannedLayer })}
                    </span>
                  ) : null}
                </span>
                <ArrowRight className="text-subtle size-4 shrink-0" />
              </Link>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

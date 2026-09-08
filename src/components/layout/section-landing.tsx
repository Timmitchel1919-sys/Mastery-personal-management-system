"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { Button, Card } from "@/components/ui";
import { ModuleCard } from "@/components/mastery";
import { NAV_SECTIONS, navMessageKey, navSectionMessageKey } from "@/config/navigation";
import { MODULE_OVERVIEW } from "@/config/module-overview";

/**
 * The home page for a Mastery module (PLAN, FOCUS, ACT, GROW, ANALYTICS).
 *
 * Layout follows the Mastery module template: header + the one dominant primary
 * action, a "Start here" row of the highest-priority submodules, then the full
 * set of areas. Every card is the shared `ModuleCard`; copy comes from
 * `@/config/module-overview`. Falls back to a plain link grid for any section
 * without an overview config.
 */
export function SectionLanding({ sectionId }: { sectionId: string }) {
  const t = useTranslations();
  const section = NAV_SECTIONS.find((entry) => entry.id === sectionId);
  if (!section) return null;

  const sectionKey = navSectionMessageKey(section.id);
  const sectionLabel = t.has(sectionKey) ? t(sectionKey) : section.label;
  const overview = MODULE_OVERVIEW[sectionId];

  const labelFor = (href: string, fallback: string) => {
    const key = navMessageKey(href);
    return t.has(key) ? t(key) : fallback;
  };

  if (!overview) {
    return (
      <PageContainer size="wide">
        <PageHeader
          title={sectionLabel}
          description={t("chrome.sectionOverview", { section: sectionLabel.toLowerCase() })}
          breadcrumbs={<BreadcrumbTrail />}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => (
            <Card key={item.href} className="hover:border-border-strong transition-colors">
              <Link
                href={item.href}
                className="focus-visible:ring-ring flex items-center gap-3 rounded-lg p-4 outline-none focus-visible:ring-2"
              >
                <span className="bg-surface text-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {labelFor(item.href, item.label)}
                </span>
                <ArrowRight className="text-subtle size-4 shrink-0" aria-hidden="true" />
              </Link>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  const featuredSet = new Set(overview.featured);
  const featured = overview.featured.flatMap((href) => {
    const item = section.items.find((entry) => entry.href === href);
    return item ? [item] : [];
  });
  const rest = section.items.filter((item) => !featuredSet.has(item.href));

  return (
    <PageContainer size="wide" className="space-y-8">
      <PageHeader
        title={sectionLabel}
        description={overview.question}
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button asChild>
            <Link href={overview.primaryAction.href}>
              <Plus aria-hidden="true" />
              {overview.primaryAction.label}
            </Link>
          </Button>
        }
      />

      {featured.length > 0 ? (
        <section aria-labelledby="module-start-here" className="space-y-3">
          <h2 id="module-start-here" className="text-eyebrow">
            Start here
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <ModuleCard
                key={item.href}
                href={item.href}
                icon={item.icon}
                accent="gold"
                title={labelFor(item.href, item.label)}
                description={overview.descriptions[item.href] ?? ""}
              />
            ))}
          </div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section aria-labelledby="module-all-areas" className="space-y-3">
          <h2 id="module-all-areas" className="text-eyebrow">
            All areas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <ModuleCard
                key={item.href}
                href={item.href}
                icon={item.icon}
                accent="neutral"
                title={labelFor(item.href, item.label)}
                description={overview.descriptions[item.href] ?? ""}
              />
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}

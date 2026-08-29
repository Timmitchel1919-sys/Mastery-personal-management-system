import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { Card } from "@/components/ui";
import { NAV_SECTIONS } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Landing page for a nav section: a grid of links to its module routes. */
export function SectionLanding({ sectionId }: { sectionId: string }) {
  const section = NAV_SECTIONS.find((entry) => entry.id === sectionId);
  if (!section) return null;

  return (
    <PageContainer size="wide">
      <PageHeader
        title={section.label}
        description={`Jump into any ${section.label.toLowerCase()} area.`}
        breadcrumbs={<BreadcrumbTrail />}
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => {
          const Icon = item.icon;
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
                  <span className="block truncate text-sm font-medium">{item.label}</span>
                  {item.plannedLayer ? (
                    <span className="text-subtle block text-xs">Layer {item.plannedLayer}</span>
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

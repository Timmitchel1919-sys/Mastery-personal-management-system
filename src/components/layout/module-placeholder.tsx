import type { ReactNode } from "react";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { Card, CardContent } from "@/components/ui";

export interface ModulePlaceholderProps {
  title: string;
  description?: string;
  /** Build layer that will implement this screen. */
  plannedLayer?: number;
  children?: ReactNode;
}

/**
 * Standard body for a not-yet-implemented module route. The navigation shell,
 * routing, breadcrumbs, and active states are real; the module content arrives in
 * its planned layer.
 */
export function ModulePlaceholder({
  title,
  description,
  plannedLayer,
  children,
}: ModulePlaceholderProps) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} breadcrumbs={<BreadcrumbTrail />} />
      <Card className="mt-6">
        <CardContent className="text-muted p-6 text-sm">
          {children ?? (
            <p>
              This screen is part of the Mastery build plan
              {plannedLayer ? ` and is implemented in Layer ${plannedLayer}` : ""}. Navigation,
              routing, and layout are in place now.
            </p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

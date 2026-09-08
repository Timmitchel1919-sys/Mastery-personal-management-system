"use client";

import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { BrainHub } from "./BrainHub";

/**
 * Page host for the Brain Hub. The topbar and sidebar are untouched — this is an
 * additive navigation surface that Layer B will expand with the zoom / submodule
 * experience.
 */
export function BrainHubView() {
  return (
    <PageContainer size="wide" className="space-y-8">
      <PageHeader
        title="Brain Hub"
        description="The Mastery brain — your six modules around one centre. Select a module to open it; the immersive zoom arrives in a later layer."
        breadcrumbs={<BreadcrumbTrail />}
      />
      <BrainHub />
    </PageContainer>
  );
}

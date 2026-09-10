"use client";

import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui";
import { useIntelligence } from "@/features/intelligence";
import { useBrainSystemState } from "../use-brain-system-state";
import { BrainHub } from "./BrainHub";

/**
 * Page host for the Brain Hub. The topbar and sidebar are untouched — this is an
 * additive navigation surface that Layer B will expand with the zoom / submodule
 * experience.
 */
export function BrainHubView() {
  const { state, reload } = useBrainSystemState();
  const intelligence = useIntelligence();

  const mergedState = {
    ...state,
    modules: {
      ...state.modules,
      goals: {
        ...state.modules.goals,
        attentionCount:
          state.modules.goals.attentionCount + (intelligence.moduleAttention.goals?.count ?? 0),
      },
      plan: {
        ...state.modules.plan,
        attentionCount:
          state.modules.plan.attentionCount + (intelligence.moduleAttention.plan?.count ?? 0),
      },
      focus: {
        ...state.modules.focus,
        attentionCount:
          state.modules.focus.attentionCount + (intelligence.moduleAttention.focus?.count ?? 0),
      },
      act: {
        ...state.modules.act,
        attentionCount:
          state.modules.act.attentionCount + (intelligence.moduleAttention.act?.count ?? 0),
      },
      grow: {
        ...state.modules.grow,
        attentionCount:
          state.modules.grow.attentionCount + (intelligence.moduleAttention.grow?.count ?? 0),
      },
      analytics: {
        ...state.modules.analytics,
        attentionCount:
          state.modules.analytics.attentionCount +
          (intelligence.moduleAttention.analytics?.count ?? 0),
      },
    },
  };

  for (const moduleId of ["goals", "plan", "focus", "act", "grow", "analytics"] as const) {
    if (
      intelligence.moduleAttention[moduleId].count > 0 &&
      mergedState.modules[moduleId].status !== "unavailable"
    ) {
      mergedState.modules[moduleId].status = "attention";
    }
  }

  return (
    <PageContainer size="wide" className="space-y-8">
      <PageHeader
        title="Brain Hub"
        description="The Mastery brain — your six systems around one center. Spatial state reflects real module signals; execution still happens in 2D workspaces."
        breadcrumbs={<BreadcrumbTrail />}
      />
      <div className="mastery-glass rounded-2xl px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p className="text-muted">
            System activity:
            <span className="text-foreground ml-1 font-semibold capitalize">{state.overallActivity}</span>
          </p>
          <p className="text-muted">
            Signal source:
            <span className="text-foreground ml-1 font-semibold capitalize">{state.source}</span>
          </p>
          {state.availability === "unavailable" ? (
            <p className="text-warning">System status unavailable. Showing neutral state.</p>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => void reload()} className="ml-auto">
            Refresh signals
          </Button>
        </div>
      </div>
      <BrainHub systemState={mergedState} />
    </PageContainer>
  );
}

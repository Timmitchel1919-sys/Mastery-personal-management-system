"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui";
import { useAdaptation } from "../use-adaptation";

/**
 * Layer S → Layer N integration. A deliberately small Command Center surface:
 * the single most severe signal plus the count of proposals awaiting review,
 * and a link into the Adaptation center. Renders nothing when there is
 * nothing worth surfacing — the dashboard does not reorder for its own sake.
 */
export function AdaptationSignalsPanel() {
  const { status, signals, activeProposals } = useAdaptation();

  if (status === "loading") return null;
  const topSignal = signals[0] ?? null;
  if (!topSignal && activeProposals.length === 0) return null;

  return (
    <section aria-labelledby="cc-adaptation-heading" className="mastery-panel space-y-2 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="cc-adaptation-heading" className="text-eyebrow flex items-center gap-1.5">
          <Compass className="size-3.5" aria-hidden="true" />
          Adaptation
        </h2>
        <Button asChild size="sm" variant="ghost">
          <Link href="/adaptation">Open Adaptation</Link>
        </Button>
      </div>
      {topSignal ? <p className="text-foreground text-sm">{topSignal.statement}</p> : null}
      {activeProposals.length > 0 ? (
        <p className="text-muted text-sm">
          {activeProposals.length} adaptation proposal{activeProposals.length === 1 ? "" : "s"} awaiting your review.
        </p>
      ) : null}
    </section>
  );
}

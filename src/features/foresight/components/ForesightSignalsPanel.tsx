"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui";
import { useForesight } from "../use-foresight";

/**
 * Layer U → Layer N integration. A deliberately small Command Center surface:
 * the single top early warning plus the forecast count, linking into
 * Predictions. Renders nothing when there is nothing meaningful to forecast.
 */
export function ForesightSignalsPanel() {
  const { status, warnings, activeForecasts } = useForesight();

  if (status === "loading") return null;
  const topWarning = warnings[0] ?? null;
  if (!topWarning && activeForecasts.length === 0) return null;

  return (
    <section aria-labelledby="cc-foresight-heading" className="mastery-panel space-y-2 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="cc-foresight-heading" className="text-eyebrow flex items-center gap-1.5">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          Predictions
        </h2>
        <Button asChild size="sm" variant="ghost">
          <Link href="/predictions">Open Predictions</Link>
        </Button>
      </div>
      {topWarning ? <p className="text-foreground text-sm">{topWarning.statement}</p> : null}
      <p className="text-muted text-sm">
        {activeForecasts.length} active forecast{activeForecasts.length === 1 ? "" : "s"}.
      </p>
    </section>
  );
}

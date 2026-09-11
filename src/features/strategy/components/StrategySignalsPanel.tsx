"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui";
import { useStrategy } from "../use-strategy";

/**
 * Layer O → Layer N integration. A deliberately small surface: the single most
 * relevant strategic signal (drift or top recommendation) plus a link into the
 * Strategy view. Renders nothing when there is no high-relevance item — the
 * Command Center is not the place for the full analysis.
 */
export function StrategySignalsPanel() {
  const { status, state } = useStrategy();

  if (status === "loading") return null;

  const topDrift = state.drift[0] ?? null;
  const topRecommendation = state.recommendations[0] ?? null;
  if (!topDrift && !topRecommendation) return null;

  return (
    <section
      aria-labelledby="cc-strategy-heading"
      className="mastery-panel space-y-3 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="cc-strategy-heading" className="text-eyebrow flex items-center gap-1.5">
          <Compass className="size-3.5" aria-hidden="true" />
          Strategic signals
        </h2>
        <Button asChild size="sm" variant="ghost">
          <Link href="/strategy">Open Strategy</Link>
        </Button>
      </div>

      {topDrift ? (
        <p className="text-foreground text-sm">
          <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">Drift</span>{" "}
          {topDrift.statement}
        </p>
      ) : null}

      {topRecommendation ? (
        <p className="text-muted text-sm">
          <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">Consider</span>{" "}
          {topRecommendation.title} — {topRecommendation.observation}
        </p>
      ) : null}

      <p className="text-subtle text-xs">
        Advisory only. Review the full picture and options in Strategy, or{" "}
        <Link href="/simulation" className="text-primary hover:underline">
          model a what-if in Simulation
        </Link>
        .
      </p>
    </section>
  );
}

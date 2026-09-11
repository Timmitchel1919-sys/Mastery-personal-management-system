"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAdaptation } from "@/features/adaptation";
import type { SignalType } from "@/features/adaptation";
import type { BrainModuleId } from "@/features/brain-hub";
import { cn } from "@/lib/utils";

const MODULE_SIGNAL_TYPES: Record<BrainModuleId, SignalType[]> = {
  goals: ["GOAL_SIGNAL", "PROGRESS_SIGNAL"],
  plan: ["PLAN_SIGNAL", "CAPACITY_SIGNAL", "CONTEXT_SIGNAL"],
  focus: ["FOCUS_SIGNAL", "CAPACITY_SIGNAL"],
  act: ["EXECUTION_SIGNAL", "DEADLINE_SIGNAL"],
  grow: ["LEARNING_SIGNAL"],
  analytics: ["RISK_SIGNAL", "BEHAVIORAL_PATTERN_SIGNAL"],
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "text-danger",
  HIGH: "text-warning",
  MEDIUM: "text-primary",
  LOW: "text-muted",
  INFO: "text-subtle",
};

/**
 * Layer T — contextual intelligence, scoped. Shows the single most relevant
 * adaptation signal for the module currently open (per §11–13: relevant, not
 * everything). Renders nothing when no signal applies to this module — this
 * is a targeted risk line, not a second insight panel.
 */
export function ModuleContextStrip({ moduleId, className }: { moduleId: BrainModuleId; className?: string }) {
  const { status, signals } = useAdaptation();
  if (status === "loading") return null;

  const relevantTypes = MODULE_SIGNAL_TYPES[moduleId];
  const topSignal = signals.find((signal) => relevantTypes.includes(signal.type));
  if (!topSignal) return null;

  return (
    <div className={cn("border-border-gold/60 bg-gold-subtle/40 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm", className)}>
      <AlertTriangle className={cn("mt-0.5 size-3.5 shrink-0", SEVERITY_STYLE[topSignal.severity])} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-foreground">{topSignal.statement}</p>
        <Link href="/adaptation" className="text-primary text-xs hover:underline">
          Review in Adaptation
        </Link>
      </div>
    </div>
  );
}

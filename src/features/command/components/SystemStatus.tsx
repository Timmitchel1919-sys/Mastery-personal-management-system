"use client";

import { CheckCircle2, OctagonPause, WifiOff } from "lucide-react";
import { useAutonomy } from "@/features/autonomy";
import { useIntelligence } from "@/features/intelligence";
import { cn } from "@/lib/utils";

export type SystemStatusKind = "normal" | "ai-limited" | "sync-issue" | "automation-paused";

const STATUS_META: Record<SystemStatusKind, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  normal: { label: "All systems normal", className: "text-success", icon: CheckCircle2 },
  "ai-limited": { label: "AI limited", className: "text-warning", icon: WifiOff },
  "sync-issue": { label: "Sync issue", className: "text-warning", icon: WifiOff },
  "automation-paused": { label: "Automation paused", className: "text-muted", icon: OctagonPause },
};

/**
 * Layer T — a lightweight, always-on system status indicator. It never exposes
 * infrastructure detail — just enough for the user to know MASTERY's core
 * functions remain usable even when an optional intelligence service is down.
 * Intentionally cheap: two already-loaded hooks, no new fetch.
 */
export function SystemStatus({ className }: { className?: string }) {
  const { paused } = useAutonomy();
  const { status, error } = useIntelligence();

  const kind: SystemStatusKind = paused
    ? "automation-paused"
    : status === "error"
      ? error?.toLowerCase().includes("network")
        ? "sync-issue"
        : "ai-limited"
      : "normal";

  const meta = STATUS_META[kind];
  const Icon = meta.icon;

  return (
    <span
      role="status"
      aria-label={meta.label}
      className={cn("hidden items-center gap-1.5 text-xs font-medium sm:inline-flex", meta.className, className)}
      title={meta.label}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="hidden lg:inline">{meta.label}</span>
    </span>
  );
}

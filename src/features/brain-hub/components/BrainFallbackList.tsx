"use client";

import { cn } from "@/lib/utils";
import {
  BRAIN_MODULES,
  type BrainModuleId,
  type BrainModuleStatus,
} from "../brain-navigation";

interface BrainFallbackListProps {
  selectedId: BrainModuleId | null;
  onSelect: (id: BrainModuleId) => void;
  statusById?: Partial<Record<BrainModuleId, BrainModuleStatus>>;
  /** When true this list IS the navigation (no WebGL / tiny viewport / reduced motion). */
  primary?: boolean;
  className?: string;
}

/**
 * The non-spatial equivalent of the brain: a plain, always-available list of the
 * six modules. Rendered alongside the scene for assistive tech, and promoted to
 * the primary control when the spatial layout is not viable.
 */
export function BrainFallbackList({
  selectedId,
  onSelect,
  statusById,
  primary,
  className,
}: BrainFallbackListProps) {
  return (
    <ul
      className={cn(primary ? "grid gap-2 sm:grid-cols-2" : "sr-only", className)}
      aria-label="Mastery modules"
    >
      {BRAIN_MODULES.map((module) => {
        const Icon = module.icon;
        const selected = module.id === selectedId;
        const status = statusById?.[module.id];
        return (
          <li key={module.id}>
            <button
              type="button"
              onClick={() => onSelect(module.id)}
              aria-current={selected ? "true" : undefined}
              className="border-border bg-surface-raised hover:border-border-strong focus-visible:ring-ring data-selected:border-primary flex w-full items-center gap-3 rounded-xl border p-3 text-left outline-none focus-visible:ring-2"
              data-selected={selected || undefined}
            >
              <span className="bg-gold-subtle text-accent inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{module.label}</span>
                {status && status !== "normal" ? (
                  <span className="text-subtle text-xs capitalize">{status}</span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { nodePosition, type BrainModule, type BrainModuleStatus } from "../brain-navigation";

const STATUS_META: Record<Exclude<BrainModuleStatus, "normal">, { label: string; dot: string }> = {
  attention: { label: "Needs attention", dot: "bg-warning" },
  active: { label: "Active now", dot: "bg-success" },
};

interface BrainNodeProps {
  module: BrainModule;
  selected: boolean;
  /** Another module is engaged — this one steps back but stays reachable. */
  dimmed?: boolean;
  /** Real status only. `normal` / undefined renders no indicator. */
  status?: BrainModuleStatus;
  /** Node radius as a % of the stage half-size. */
  radius: number;
  /** id of the preview element to associate while this node is hovered/focused. */
  previewId?: string;
  previewOpen?: boolean;
  onSelect: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

/**
 * One module node in the spatial layout — a real semantic button, absolutely
 * placed on the stage. Hover, keyboard focus, the selected/dimmed state, and the
 * optional hover-preview association are handled here; the scene only reflects
 * them.
 */
export function BrainNode({
  module,
  selected,
  dimmed,
  status,
  radius,
  previewId,
  previewOpen,
  onSelect,
  onActivate,
  onDeactivate,
}: BrainNodeProps) {
  const Icon = module.icon;
  const { x, y } = nodePosition(module.angle, radius);
  const statusMeta = status && status !== "normal" ? STATUS_META[status] : null;

  return (
    <button
      type="button"
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      aria-label={`Open ${module.label}`}
      aria-describedby={previewOpen && previewId ? previewId : undefined}
      onClick={onSelect}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      style={{ left: `${x}%`, top: `${y}%` }}
      className={cn(
        "brain-node bg-surface-raised/85 border-border text-foreground focus-visible:ring-ring absolute z-10 flex min-h-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
        dimmed && "brain-node--dimmed",
      )}
    >
      <span className="bg-gold-subtle text-accent relative inline-flex size-7 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden="true" />
        {statusMeta ? (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "border-surface-raised absolute -top-1 -right-1 size-2.5 rounded-full border",
                statusMeta.dot,
              )}
            />
            <span className="sr-only">{statusMeta.label}</span>
          </>
        ) : null}
      </span>
      <span className="text-xs font-semibold tracking-tight">{module.label}</span>
    </button>
  );
}

"use client";

import { nodePosition, type BrainModule } from "../brain-navigation";

interface BrainNodeProps {
  module: BrainModule;
  selected: boolean;
  /** Node radius as a % of the stage half-size. */
  radius: number;
  onSelect: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

/**
 * One module node in the spatial layout — a real semantic button, absolutely
 * placed on the stage. Hover, keyboard focus, and the selected/active state are
 * all handled here; the 3D scene only reflects them.
 */
export function BrainNode({
  module,
  selected,
  radius,
  onSelect,
  onActivate,
  onDeactivate,
}: BrainNodeProps) {
  const Icon = module.icon;
  const { x, y } = nodePosition(module.angle, radius);

  return (
    <button
      type="button"
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      aria-label={`${module.label} module`}
      onClick={onSelect}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="brain-node bg-surface-raised/85 border-border text-foreground focus-visible:ring-ring absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      <span className="bg-gold-subtle text-accent inline-flex size-7 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-xs font-semibold tracking-tight">{module.label}</span>
    </button>
  );
}

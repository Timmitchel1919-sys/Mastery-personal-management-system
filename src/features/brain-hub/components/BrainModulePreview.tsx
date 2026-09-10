"use client";

import { nodePosition, type BrainModule } from "../brain-navigation";
import type { BrainModuleStatus } from "../brain-modules";

interface BrainModulePreviewProps {
  id: string;
  module: BrainModule;
  /** Submodule names for this module — real labels from the nav config. */
  items: string[];
  /** Node radius as a % of the stage half-size — the preview sits just outside it. */
  radius: number;
  status?: BrainModuleStatus;
  progress?: number | null;
  attentionCount?: number;
}

/**
 * A lightweight glass preview shown while a module node is hovered or
 * keyboard-focused. Preview only — Layer C builds the full module environment.
 * It is `role="tooltip"` and referenced by the node's `aria-describedby`, so it
 * reaches keyboard users too, and it disappears with the pointer / focus.
 */
export function BrainModulePreview({
  id,
  module,
  items,
  radius,
  status,
  progress,
  attentionCount = 0,
}: BrainModulePreviewProps) {
  const { x, y } = nodePosition(module.angle, radius);
  // Nudge the card away from the core so it doesn't cover the node.
  const outward = nodePosition(module.angle, Math.min(radius + 12, 50));

  return (
    <div
      id={id}
      role="tooltip"
      style={{ left: `${outward.x}%`, top: `${outward.y}%` }}
      className="mastery-glass mastery-expand pointer-events-none absolute z-20 w-44 -translate-x-1/2 -translate-y-1/2 rounded-xl p-3"
      data-anchor-x={x}
      data-anchor-y={y}
    >
      <p className="text-eyebrow mb-1.5">{module.label}</p>
      {status && status !== "normal" ? (
        <p className="text-subtle mb-1 text-[0.6875rem] font-semibold uppercase">{status}</p>
      ) : null}
      {typeof progress === "number" ? (
        <p className="text-subtle mb-1 text-[0.6875rem] tabular-nums">Progress {Math.round(progress)}%</p>
      ) : null}
      {attentionCount > 0 ? (
        <p className="text-warning mb-1 text-[0.6875rem]">{attentionCount} need attention</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="text-muted space-y-0.5 text-xs">
          {items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-subtle text-xs">Open to explore this system.</p>
      )}
    </div>
  );
}

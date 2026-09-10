"use client";

import type { CSSProperties } from "react";
import {
  BRAIN_MODULES,
  brainModule,
  nodePosition,
  type BrainHubPhase,
  type BrainModuleId,
  type BrainModuleStatus,
} from "../brain-navigation";
import type { BrainOverallActivity, BrainModuleVisual } from "../brain-state";

interface BrainSceneProps {
  activeId: BrainModuleId | null;
  selectedId: BrainModuleId | null;
  phase: BrainHubPhase;
  /** Node radius as a % of the stage half-size — the caller keeps nodes in sync. */
  nodeRadius: number;
  /** Disable the drift / pulse / impulse animation regardless of the media query. */
  reducedMotion: boolean;
  overallActivity?: BrainOverallActivity;
  statusById?: Partial<Record<BrainModuleId, BrainModuleVisual>>;
}

/**
 * The swappable RENDERER boundary for the Brain Hub. A procedural, dependency-free
 * brain: layered CSS glows with perspective depth + an SVG neural web. It also
 * owns the "camera": a CSS transform on the whole scene that moves toward the
 * selected module while `phase` is `transitioning` / `module-active`. Pure
 * presentation — it reads active/selected/phase and draws; it owns no app state.
 * A future WebGL renderer replaces this one file without touching the contract.
 */
export function BrainScene({
  activeId,
  selectedId,
  phase,
  nodeRadius,
  reducedMotion,
  overallActivity = "idle",
  statusById,
}: BrainSceneProps) {
  const engaged = phase !== "home" && selectedId != null;

  // "Camera": scale up and shift so the selected side comes forward. The shift is
  // opposite the node so the chosen module ends up nearer the centre.
  let camScale = 1;
  let camX = 0;
  let camY = 0;
  if (engaged && selectedId) {
    const { angle } = brainModule(selectedId);
    const rad = (angle * Math.PI) / 180;
    camScale = phase === "module-active" ? 1.32 : 1.16;
    camX = -Math.sin(rad) * 10;
    camY = Math.cos(rad) * 10;
  }

  const cameraStyle: CSSProperties = {
    transform: `translate(${camX}%, ${camY}%) scale(${camScale})`,
    transition: reducedMotion
      ? "none"
      : "transform var(--duration-slow) var(--ease-in-out)",
  };

  const links = BRAIN_MODULES.map((module, index) => {
    const next = BRAIN_MODULES[(index + 1) % BRAIN_MODULES.length];
    return { from: module.id, to: next?.id ?? module.id };
  });

  const activePivot = selectedId ?? activeId;
  const attentionModuleIds = new Set(
    BRAIN_MODULES.filter((module) => statusById?.[module.id]?.status === "attention").map(
      (module) => module.id,
    ),
  );

  function connectorOpacity(moduleId: BrainModuleId): number {
    const status = statusById?.[moduleId]?.status;
    const hot = moduleId === selectedId || moduleId === activeId;
    if (hot) return 0.95;
    if (status === "attention") return 0.58;
    if (status === "active" || status === "progress") return 0.48;
    if (status === "completed") return 0.4;
    return engaged ? 0.16 : overallActivity === "active" ? 0.3 : 0.24;
  }

  function statusStroke(status: BrainModuleStatus | undefined): string | undefined {
    if (status === "attention") return "var(--color-warning)";
    if (status === "completed") return "var(--color-success)";
    if (status === "active" || status === "progress") return "var(--color-gold-soft)";
    return undefined;
  }

  return (
    <div
      aria-hidden="true"
      className="brain-stage pointer-events-none absolute inset-0"
      data-overall-activity={overallActivity}
    >
      <div className="brain-camera absolute inset-0" style={cameraStyle}>
        {/* Neural web — connectors from the core to each node. */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {BRAIN_MODULES.map((module) => {
            const { x, y } = nodePosition(module.angle, nodeRadius);
            const isSelected = module.id === selectedId;
            const isHot = module.id === activeId || isSelected;
            const dimmed = engaged && !isSelected;
            const impulse = !reducedMotion && (isHot || (engaged && isSelected));
            const status = statusById?.[module.id]?.status;
            return (
              <g key={module.id}>
                <line
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  className="brain-connector"
                  strokeWidth={isHot ? 1.1 : 0.6}
                  stroke={statusStroke(status)}
                  strokeOpacity={dimmed ? 0.14 : connectorOpacity(module.id)}
                  vectorEffect="non-scaling-stroke"
                />
                {impulse ? (
                  <line
                    x1={50}
                    y1={50}
                    x2={x}
                    y2={y}
                    stroke="var(--color-gold-soft)"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeDasharray="4 42"
                    className={
                      phase === "transitioning" && isSelected
                        ? "brain-impulse brain-impulse--fast"
                        : "brain-impulse"
                    }
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </g>
            );
          })}

          {/* System relationships around the brain: goals→plan→focus→act→grow→analytics→goals */}
          {nodeRadius > 0
            ? links.map((link) => {
                const from = brainModule(link.from);
                const to = brainModule(link.to);
                const fromPos = nodePosition(from.angle, nodeRadius);
                const toPos = nodePosition(to.angle, nodeRadius);
                const connectedToPivot = activePivot === link.from || activePivot === link.to;
                const attention =
                  attentionModuleIds.has(link.from) || attentionModuleIds.has(link.to);
                return (
                  <line
                    key={`${link.from}-${link.to}`}
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    className="brain-system-link"
                    strokeOpacity={connectedToPivot ? 0.62 : attention ? 0.46 : 0.2}
                    strokeWidth={connectedToPivot ? 1.2 : 0.8}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })
            : null}
        </svg>

        {/* The brain core. */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="brain-core relative aspect-square w-40 rounded-full sm:w-48 lg:w-56"
            data-engaged={engaged || undefined}
            style={reducedMotion ? { animation: "none" } : undefined}
          />
        </div>
      </div>
    </div>
  );
}

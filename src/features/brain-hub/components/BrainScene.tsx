"use client";

import type { CSSProperties } from "react";
import {
  BRAIN_MODULES,
  brainModule,
  nodePosition,
  type BrainHubPhase,
  type BrainModuleId,
} from "../brain-navigation";

interface BrainSceneProps {
  activeId: BrainModuleId | null;
  selectedId: BrainModuleId | null;
  phase: BrainHubPhase;
  /** Node radius as a % of the stage half-size — the caller keeps nodes in sync. */
  nodeRadius: number;
  /** Disable the drift / pulse / impulse animation regardless of the media query. */
  reducedMotion: boolean;
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

  return (
    <div aria-hidden="true" className="brain-stage pointer-events-none absolute inset-0">
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
            return (
              <g key={module.id}>
                <line
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  className="brain-connector"
                  strokeWidth={isHot ? 1.1 : 0.6}
                  strokeOpacity={dimmed ? 0.14 : isHot ? 0.95 : 0.35}
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

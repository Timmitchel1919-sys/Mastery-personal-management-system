"use client";

import { BRAIN_MODULES, nodePosition, type BrainModuleId } from "../brain-navigation";

interface BrainSceneProps {
  activeId: BrainModuleId | null;
  selectedId: BrainModuleId | null;
  /** Node radius as a % of the stage half-size — the caller keeps nodes in sync. */
  nodeRadius: number;
  /** Disable the drift/impulse animation regardless of the media query. */
  reducedMotion: boolean;
}

/**
 * The swappable RENDERER boundary for the Brain Hub. Today it is a procedural,
 * dependency-free brain (layered CSS glows + an SVG neural web); a future WebGL
 * renderer can replace this file without any change to `BrainHub` or the
 * navigation contract. Pure presentation — it receives which node is
 * active/selected and draws accordingly, and owns no application state.
 */
export function BrainScene({ activeId, selectedId, nodeRadius, reducedMotion }: BrainSceneProps) {
  return (
    <div aria-hidden="true" className="brain-stage pointer-events-none absolute inset-0">
      {/* Neural web — connectors from the core to each node. */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {BRAIN_MODULES.map((module) => {
          const { x, y } = nodePosition(module.angle, nodeRadius);
          const emphasised = module.id === activeId || module.id === selectedId;
          return (
            <g key={module.id}>
              <line
                x1={50}
                y1={50}
                x2={x}
                y2={y}
                className="brain-connector"
                strokeWidth={emphasised ? 1 : 0.6}
                strokeOpacity={emphasised ? 0.9 : 0.35}
                vectorEffect="non-scaling-stroke"
              />
              {emphasised && !reducedMotion ? (
                <line
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  stroke="var(--color-gold-soft)"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeDasharray="4 42"
                  className="brain-impulse"
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
          style={reducedMotion ? { animation: "none" } : undefined}
        />
      </div>
    </div>
  );
}

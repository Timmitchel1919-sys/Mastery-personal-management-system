import { SectionHeader } from "@/components/ui";
import { MARKETING_MODULES } from "./marketing-modules";
import { Reveal } from "./Reveal";

/**
 * "Everything connected." A hub-and-spoke diagram: the six modules ring a central
 * node, gold spokes joining each to the centre and a faint ring joining them to
 * each other — one system, not six tools.
 */

// Even hexagon placement around the centre (percent coords, viewBox 0 0 100 100).
const RING: { id: string; x: number; y: number }[] = [
  { id: "plan", x: 50, y: 8 },
  { id: "goals", x: 87, y: 30 },
  { id: "focus", x: 87, y: 70 },
  { id: "act", x: 50, y: 92 },
  { id: "grow", x: 13, y: 70 },
  { id: "analytics", x: 13, y: 30 },
];

const MODULE_BY_ID = new Map(MARKETING_MODULES.map((pillar) => [pillar.id, pillar]));

export function OneSystem() {
  return (
    <section className="bg-section/40 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <SectionHeader
            eyebrow="One system"
            heading="Everything connected."
            description="Planning, goals, focus, execution, growth, and analytics are not six apps bolted together — they are one system that shares a single source of truth."
          />
        </Reveal>

        <Reveal delay={100} className="mt-16">
          <div className="relative mx-auto aspect-square w-full max-w-xl">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* ring between neighbours */}
              {RING.map((node, index) => {
                const next = RING[(index + 1) % RING.length];
                if (!next) return null;
                return (
                  <line
                    key={`ring-${node.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="var(--color-border-strong)"
                    strokeWidth="0.6"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {/* spokes to the centre */}
              {RING.map((node) => (
                <line
                  key={`spoke-${node.id}`}
                  x1="50"
                  y1="50"
                  x2={node.x}
                  y2={node.y}
                  stroke="var(--color-gold)"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* centre */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="mastery-glass mastery-glass--gold rounded-2xl px-5 py-3 text-center">
                <span className="text-eyebrow">Mastery</span>
              </div>
            </div>

            {/* module nodes */}
            {RING.map((node) => {
              const pillar = MODULE_BY_ID.get(node.id);
              if (!pillar) return null;
              const Icon = pillar.icon;
              return (
                <div
                  key={node.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <div className="mastery-glass flex items-center gap-2 rounded-xl px-3 py-2">
                    <Icon className="text-accent size-4 shrink-0" aria-hidden="true" />
                    <span className="text-foreground text-xs font-semibold tracking-tight sm:text-sm">
                      {pillar.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

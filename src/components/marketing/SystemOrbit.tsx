import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MARKETING_MODULES } from "./marketing-modules";

/**
 * The Mastery system, drawn as a real interface: the user at the centre with the
 * six modules around them. Below `lg` the nodes flow as a responsive grid; at `lg`
 * they take an orbital composition with faint gold connectors and a slow drift
 * (disabled under `prefers-reduced-motion`).
 */

// lg placement — each node is centred on its point via -translate-x/y-1/2.
const PLACEMENT: Record<string, string> = {
  plan: "lg:left-[16%] lg:top-[30%]",
  goals: "lg:left-1/2 lg:top-[8%]",
  focus: "lg:left-[84%] lg:top-[30%]",
  act: "lg:left-[16%] lg:top-[72%]",
  grow: "lg:left-[84%] lg:top-[72%]",
  analytics: "lg:left-1/2 lg:top-[92%]",
};

// Matching endpoints for the SVG connectors (viewBox 0 0 100 100).
const POINTS: Record<string, { x: number; y: number }> = {
  plan: { x: 16, y: 30 },
  goals: { x: 50, y: 8 },
  focus: { x: 84, y: 30 },
  act: { x: 16, y: 72 },
  grow: { x: 84, y: 72 },
  analytics: { x: 50, y: 92 },
};

const FLOAT_DELAY: Record<string, string> = {
  plan: "-0.5s",
  goals: "-3.2s",
  focus: "-1.8s",
  act: "-4.1s",
  grow: "-2.6s",
  analytics: "-5s",
};

export function SystemOrbit() {
  return (
    <div
      className="relative mx-auto mt-4 w-full max-w-md lg:mt-0 lg:h-[560px] lg:max-w-2xl"
      role="img"
      aria-label="The Mastery system: you at the centre, surrounded by the Plan, Goals, Focus, Act, Grow, and Analytics modules."
    >
      {/* Connectors — lg only, decorative. */}
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {MARKETING_MODULES.map((module) => (
          <line
            key={module.id}
            x1="50"
            y1="50"
            x2={POINTS[module.id]?.x}
            y2={POINTS[module.id]?.y}
            stroke="var(--color-gold)"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div
        aria-hidden="true"
        className="mastery-orbit-glow absolute top-1/2 left-1/2 hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 blur-2xl lg:block"
      />

      {/* Nodes: grid flow below lg, absolute orbit at lg. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:block lg:gap-0">
        {/* Centre */}
        <div className="col-span-2 sm:col-span-3 lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
          <div className="mastery-glass mastery-glass--gold flex flex-col items-center gap-2 rounded-2xl px-6 py-6 text-center lg:w-52">
            <span className="border-border-gold bg-surface-raised inline-flex size-14 items-center justify-center rounded-full border">
              <Logo variant="mark" height={18} withLabel={false} />
            </span>
            <span className="text-eyebrow">You</span>
            <span className="text-foreground text-sm font-semibold tracking-tight">
              Your Mastery
            </span>
          </div>
        </div>

        {MARKETING_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              style={{ animationDelay: FLOAT_DELAY[module.id] }}
              className={cn(
                "mastery-orbit-node lg:absolute lg:-translate-x-1/2 lg:-translate-y-1/2",
                PLACEMENT[module.id],
              )}
            >
              <div className="mastery-glass flex items-center gap-2.5 rounded-xl px-3 py-2.5 lg:flex-col lg:gap-1.5 lg:px-4 lg:py-3.5 lg:text-center">
                <span className="bg-gold-subtle text-accent inline-flex size-8 items-center justify-center rounded-lg lg:size-9">
                  <Icon className="size-4 lg:size-5" aria-hidden="true" />
                </span>
                <span className="text-foreground text-sm font-semibold tracking-tight">
                  {module.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

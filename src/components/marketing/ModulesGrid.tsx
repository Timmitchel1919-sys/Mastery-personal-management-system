import { Logo, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MARKETING_MODULES } from "./marketing-modules";
import { Reveal } from "./Reveal";

/**
 * The six systems around one operating core. Desktop keeps spatial orientation;
 * mobile collapses to a clean sequence without losing the same conceptual order.
 */

const PLACEMENT: Record<string, string> = {
  goals: "lg:left-1/2 lg:top-[6%]",
  plan: "lg:left-[18%] lg:top-[28%]",
  focus: "lg:left-[82%] lg:top-[28%]",
  act: "lg:left-[18%] lg:top-[72%]",
  grow: "lg:left-[82%] lg:top-[72%]",
  analytics: "lg:left-1/2 lg:top-[94%]",
};

const POINTS: Record<string, { x: number; y: number }> = {
  goals: { x: 50, y: 6 },
  plan: { x: 18, y: 28 },
  focus: { x: 82, y: 28 },
  act: { x: 18, y: 72 },
  grow: { x: 82, y: 72 },
  analytics: { x: 50, y: 94 },
};

export function ModulesGrid() {
  return (
    <section id="systems" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeader
          eyebrow="The six Mastery systems"
          heading="One operating core. Six connected systems."
          description="Every system has a distinct role, but they run as one loop so strategy and execution never drift apart."
        />
      </Reveal>

      <div className="relative mt-14">
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
              strokeOpacity="0.28"
              strokeWidth="0.9"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="grid gap-4 sm:grid-cols-2 lg:block lg:h-160">
          <div className="mastery-glass mastery-glass--gold col-span-2 flex flex-col items-center justify-center rounded-3xl p-8 text-center sm:col-span-2 lg:absolute lg:top-1/2 lg:left-1/2 lg:w-64 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <Logo variant="mark" height={30} withLabel={false} />
            <p className="text-eyebrow mt-4">MASTERY Brain</p>
            <p className="text-muted mt-2 text-sm leading-relaxed">
              The hub that connects goals, execution, growth, and analysis.
            </p>
          </div>

          {MARKETING_MODULES.map((module, index) => {
            const Icon = module.icon;
            return (
              <Reveal
                key={module.id}
                delay={index * 60}
                className={cn(
                  "lg:absolute lg:w-64 lg:-translate-x-1/2 lg:-translate-y-1/2",
                  PLACEMENT[module.id],
                )}
              >
                <article className="mastery-glass rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-gold-subtle text-accent inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-foreground text-sm font-semibold tracking-tight">
                        {module.name}
                      </h3>
                      <p className="text-muted mt-1 text-sm leading-relaxed">{module.blurb}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

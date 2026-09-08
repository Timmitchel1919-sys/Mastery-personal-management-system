import { SectionHeader } from "@/components/ui";
import { MARKETING_MODULES } from "./marketing-modules";
import { Reveal } from "./Reveal";

/**
 * The six Mastery pillars. Cards share the dashboard's `.mastery-module-card`
 * language — obsidian surface, gold accent, CSS-only hover depth.
 */
export function ModulesGrid() {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeader
          eyebrow="The six modules"
          heading="One system. Six disciplines."
          description="Each module does one job well — and hands its output to the next."
        />
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETING_MODULES.map((module, index) => {
          const Icon = module.icon;
          return (
            <Reveal key={module.id} delay={index * 60}>
              <article className="mastery-module-card h-full p-6">
                <div className="bg-gold-subtle border-border-gold mb-5 flex size-11 items-center justify-center rounded-xl border">
                  <Icon className="text-accent size-5" aria-hidden="true" />
                </div>
                <h3 className="text-foreground text-lg font-semibold tracking-tight">
                  {module.name}
                </h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{module.blurb}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

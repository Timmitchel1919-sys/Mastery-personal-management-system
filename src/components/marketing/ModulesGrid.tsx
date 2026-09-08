import { ModuleCard, SectionHeader } from "@/components/mastery";
import { MARKETING_MODULES } from "./marketing-modules";
import { Reveal } from "./Reveal";

/**
 * The six Mastery pillars. Cards use the shared `<ModuleCard />` (same component
 * the dashboard constellation renders) with no `href` — descriptive, not
 * navigable — so the landing page and the app stay visually identical.
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
        {MARKETING_MODULES.map((module, index) => (
          <Reveal key={module.id} delay={index * 60} className="h-full">
            <ModuleCard
              title={module.name}
              description={module.blurb}
              icon={module.icon}
              accent="gold"
              className="h-full"
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

import { ArrowDown } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { MARKETING_MODULES } from "./marketing-modules";
import { Reveal } from "./Reveal";

/**
 * How Mastery works — the six modules as one sequence, each feeding the next.
 * Communicates an integrated system, not six unrelated features.
 */
export function SystemFlow() {
  return (
    <section id="how-it-works" className="mx-auto max-w-3xl px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeader
          eyebrow="How it works"
          heading="A loop, not a to-do list."
          description="Every module hands its output to the next — and Analytics closes the loop back to Plan."
        />
      </Reveal>

      <ol className="mt-14 flex flex-col items-center">
        {MARKETING_MODULES.map((module, index) => (
          <li key={module.id} className="flex w-full flex-col items-center">
            <Reveal delay={index * 40} className="w-full">
              <div className="mastery-glass flex items-center gap-4 rounded-2xl p-5 sm:gap-6 sm:p-6">
                <span className="text-primary/70 text-2xl font-semibold tabular-nums sm:text-3xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-foreground text-base font-semibold tracking-tight sm:text-lg">
                    {module.name}
                  </h3>
                  <p className="text-muted mt-0.5 text-sm">{module.action}</p>
                </div>
              </div>
            </Reveal>
            {index < MARKETING_MODULES.length - 1 ? (
              <ArrowDown
                className="text-subtle my-2 size-4 shrink-0"
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

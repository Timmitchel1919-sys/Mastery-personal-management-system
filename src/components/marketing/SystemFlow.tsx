import { ArrowDown } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { Reveal } from "./Reveal";

/**
 * The full operating cycle: six system stages plus explicit improvement feedback.
 */

const CYCLE_STEPS = [
  { id: "define", title: "Define", body: "Set clear outcomes and constraints." },
  { id: "plan", title: "Plan", body: "Translate direction into structured action." },
  { id: "focus", title: "Focus", body: "Protect attention for what matters most." },
  { id: "act", title: "Act", body: "Execute consistently and finish meaningful work." },
  { id: "grow", title: "Grow", body: "Reflect, learn, and build personal capacity." },
  { id: "analyze", title: "Analyze", body: "Measure patterns, progress, and performance." },
  { id: "improve", title: "Improve", body: "Feed insights back into better decisions." },
] as const;

export function SystemFlow() {
  return (
    <section id="how-it-works" className="mx-auto max-w-3xl px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeader
          eyebrow="How it works"
          heading="A cycle, not a dashboard."
          description="Mastery runs a deliberate loop: define, plan, focus, act, grow, analyze, then improve the next cycle."
        />
      </Reveal>

      <ol className="mt-14 flex flex-col items-center">
        {CYCLE_STEPS.map((step, index) => (
          <li key={step.id} className="flex w-full flex-col items-center">
            <Reveal delay={index * 40} className="w-full">
              <div className="mastery-glass flex items-center gap-4 rounded-2xl p-5 sm:gap-6 sm:p-6">
                <span className="text-primary/70 text-2xl font-semibold tabular-nums sm:text-3xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-foreground text-base font-semibold tracking-tight sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="text-muted mt-0.5 text-sm">{step.body}</p>
                </div>
              </div>
            </Reveal>
            {index < CYCLE_STEPS.length - 1 ? (
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

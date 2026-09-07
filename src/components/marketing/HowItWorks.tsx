import { Compass, Sprout, Target, Zap } from "lucide-react";
import { SectionHeader } from "@/components/ui";

const STEPS = [
  {
    icon: Compass,
    title: "Plan",
    body: "Turn a long-term vision into five-year, yearly, and weekly plans — down to today's tasks.",
  },
  {
    icon: Target,
    title: "Focus",
    body: "Protect deep work with Pomodoro sessions, a priority matrix, and a calendar that respects both.",
  },
  {
    icon: Zap,
    title: "Act",
    body: "Execute against tasks and habits, with a daily routine that keeps the loop honest.",
  },
  {
    icon: Sprout,
    title: "Grow",
    body: "Reflect in a journal, track learning and reading, and watch your life score compound.",
  },
];

export function HowItWorks() {
  return (
    <div id="how-it-works" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <SectionHeader
        eyebrow="How Mastery works"
        heading="A loop, not a to-do list."
        description="Plan, Focus, Act, and Grow feed each other — every week closes the loop and opens the next."
      />
      <div className="relative mt-16 grid gap-6 sm:grid-cols-4">
        <div
          aria-hidden="true"
          className="border-border absolute top-6 right-[12.5%] left-[12.5%] hidden border-t border-dashed sm:block"
        />
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <div key={title} className="relative flex flex-col items-center text-center">
            <div className="bg-surface-raised border-border relative flex size-12 items-center justify-center rounded-full border">
              <Icon className="text-primary size-5" aria-hidden="true" />
            </div>
            <span className="text-subtle mt-4 text-xs font-semibold tracking-[0.08em] uppercase">
              Step {index + 1}
            </span>
            <h3 className="text-foreground mt-1 text-lg font-semibold">{title}</h3>
            <p className="text-muted mt-2 max-w-[220px] text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

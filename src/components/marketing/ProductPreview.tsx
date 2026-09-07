import { CheckCircle2, Flame, Sparkles } from "lucide-react";
import { GlassPanel, ProgressRing } from "@/components/ui";

const GOALS = ["Ship the Q3 roadmap review", "Run a 10k by October", "Read 12 books this year"];

/**
 * A floating glass preview of the product — conceptual, not a literal dashboard
 * screenshot. Reads as a personal operating system: today's focus, goals, habits,
 * the three life pillars, and one AI insight — not a generic admin panel.
 */
export function ProductPreview() {
  return (
    <div id="product" className="mx-auto max-w-4xl px-4 pt-8 pb-24 sm:pb-32">
      <GlassPanel className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-surface-raised/70 border-border flex flex-col items-center gap-3 rounded-2xl border p-5 text-center sm:col-span-1">
            <p className="text-subtle text-xs font-medium tracking-wide uppercase">
              Today&apos;s Focus
            </p>
            <ProgressRing value={68} label="68%" />
            <p className="text-muted text-xs">102 of 150 focus minutes</p>
          </div>

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5 sm:col-span-2">
            <p className="text-subtle mb-3 text-xs font-medium tracking-wide uppercase">Goals</p>
            <ul className="flex flex-col gap-2.5">
              {GOALS.map((goal) => (
                <li key={goal} className="text-foreground flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="text-primary size-4 shrink-0" aria-hidden="true" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5">
            <p className="text-subtle mb-3 text-xs font-medium tracking-wide uppercase">Habits</p>
            <div className="flex items-center gap-2">
              <Flame className="text-primary size-5" aria-hidden="true" />
              <span className="text-foreground text-2xl font-semibold tabular-nums">18</span>
              <span className="text-muted text-sm">day streak</span>
            </div>
          </div>

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5">
            <p className="text-subtle mb-3 text-xs font-medium tracking-wide uppercase">
              Life Areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="bg-gold-subtle text-accent rounded-full px-2.5 py-1 text-xs font-medium">
                Spiritual
              </span>
              <span className="bg-gold-subtle text-accent rounded-full px-2.5 py-1 text-xs font-medium">
                Personal
              </span>
              <span className="bg-gold-subtle text-accent rounded-full px-2.5 py-1 text-xs font-medium">
                Societal
              </span>
            </div>
          </div>

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5">
            <p className="text-subtle mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              AI Insight
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Your focus sessions run longest before 10am — plan tomorrow&apos;s deep work then.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

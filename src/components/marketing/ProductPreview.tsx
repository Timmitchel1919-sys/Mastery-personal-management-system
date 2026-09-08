import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { ProgressRing, SectionHeader } from "@/components/ui";
import { Reveal } from "./Reveal";

const TASKS = [
  { label: "Morning training block", done: true },
  { label: "Deep work — product spec", done: true },
  { label: "Weekly review", done: true },
  { label: "Read — 20 pages", done: false },
  { label: "Plan tomorrow", done: false },
];

const LIFE_AREAS = [
  { label: "Spiritual", caption: "Purpose", value: 70 },
  { label: "Personal", caption: "Growth", value: 60 },
  { label: "Societal", caption: "Impact", value: 45 },
];

/**
 * A conceptual look at the product — not a screenshot, but real Mastery UI
 * primitives (rings, bars, task rows) inside a glass frame with a slight
 * perspective tilt and layered gold lighting.
 */
export function ProductPreview() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeader
          eyebrow="The product"
          heading="Your day, in one view."
          description="Priorities, progress, and the three life dimensions — read at a glance, updated as you work."
        />
      </Reveal>

      <Reveal delay={120} className="mt-14">
        <div className="[perspective:1600px]">
          <div className="mastery-glass mastery-glass--gold rounded-3xl p-3 sm:p-4 lg:[transform:rotateX(3deg)]">
            <div className="bg-surface/60 rounded-2xl p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-foreground text-base font-semibold tracking-tight">
                    Good morning.
                  </p>
                  <p className="text-subtle text-xs">Discipline today. A greater tomorrow.</p>
                </div>
                <p className="text-subtle text-xs">Today · 5 priorities</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="mastery-card flex flex-col items-center gap-3 p-5 text-center">
                  <p className="text-eyebrow">Today&apos;s Focus</p>
                  <ProgressRing value={60} label="3 / 5" />
                  <p className="text-muted text-xs">tasks complete</p>
                </div>

                <div className="mastery-card p-5 lg:col-span-2">
                  <p className="text-eyebrow mb-3">Priorities</p>
                  <ul className="flex flex-col gap-2">
                    {TASKS.map((task) => (
                      <li key={task.label} className="flex items-center gap-2.5 text-sm">
                        {task.done ? (
                          <CheckCircle2
                            className="text-primary size-4 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle className="text-subtle size-4 shrink-0" aria-hidden="true" />
                        )}
                        <span className={task.done ? "text-muted line-through" : "text-foreground"}>
                          {task.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mastery-card p-5 lg:col-span-2">
                  <p className="text-eyebrow mb-3">Life dimensions</p>
                  <ul className="flex flex-col gap-3">
                    {LIFE_AREAS.map((area) => (
                      <li key={area.label} className="flex items-center gap-3 text-sm">
                        <span className="w-16 shrink-0">
                          <span className="text-foreground block font-medium">{area.label}</span>
                          <span className="text-subtle block text-xs">{area.caption}</span>
                        </span>
                        <span className="bg-surface h-1.5 flex-1 overflow-hidden rounded-full">
                          <span
                            className="bg-primary block h-full rounded-full"
                            style={{ width: `${area.value}%` }}
                          />
                        </span>
                        <span className="text-muted w-8 shrink-0 text-right text-xs tabular-nums">
                          {area.value}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mastery-card p-5">
                  <p className="text-eyebrow mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Weekly insight
                  </p>
                  <p className="text-muted text-sm leading-relaxed">
                    Your focus sessions run longest before 10am — schedule tomorrow&apos;s deep
                    work then.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

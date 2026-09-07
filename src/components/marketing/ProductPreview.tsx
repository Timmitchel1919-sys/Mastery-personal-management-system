import {
  CalendarPlus,
  CheckCircle2,
  Circle,
  NotebookPen,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { GlassPanel, ProgressRing } from "@/components/ui";

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

const QUICK_ACTIONS = [
  { label: "New Task", icon: CheckCircle2 },
  { label: "Add Goal", icon: Target },
  { label: "Focus Mode", icon: Timer },
  { label: "Journal", icon: NotebookPen },
  { label: "Plan Day", icon: CalendarPlus },
];

/**
 * A floating glass preview of the product — conceptual, not a literal screenshot. Reads
 * as a personal operating system: a greeting, today's focus, the three life pillars, one
 * AI insight, and quick actions — connecting the marketing page to the real app.
 */
export function ProductPreview() {
  return (
    <div id="product" className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:pb-32">
      <GlassPanel className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-foreground text-base font-semibold tracking-tight">Good morning.</p>
            <p className="text-subtle text-xs">Discipline today. A greater tomorrow.</p>
          </div>
          <p className="text-subtle text-xs">Today · 5 priorities</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-surface-raised/70 border-border flex flex-col items-center gap-3 rounded-2xl border p-5 text-center">
            <p className="text-subtle text-xs font-medium tracking-wide uppercase">
              Today&apos;s Focus
            </p>
            <ProgressRing value={60} label="3 / 5" />
            <p className="text-muted text-xs">tasks complete</p>
          </div>

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5 sm:col-span-2">
            <p className="text-subtle mb-3 text-xs font-medium tracking-wide uppercase">
              Priorities
            </p>
            <ul className="flex flex-col gap-2">
              {TASKS.map((task) => (
                <li key={task.label} className="flex items-center gap-2.5 text-sm">
                  {task.done ? (
                    <CheckCircle2 className="text-primary size-4 shrink-0" aria-hidden="true" />
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

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5 sm:col-span-2">
            <p className="text-subtle mb-3 text-xs font-medium tracking-wide uppercase">
              Life Areas
            </p>
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

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5">
            <p className="text-subtle mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              AI Insight
            </p>
            <p className="text-muted text-sm leading-relaxed">
              Your focus sessions run longest before 10am — schedule tomorrow&apos;s deep work then.
            </p>
          </div>

          <div className="bg-surface-raised/70 border-border rounded-2xl border p-5 sm:col-span-3">
            <p className="text-subtle mb-3 text-xs font-medium tracking-wide uppercase">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <span
                    key={action.label}
                    className="border-border bg-gold-subtle text-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {action.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

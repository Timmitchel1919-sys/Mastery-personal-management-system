import { Layers, ShieldCheck, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/ui";

const VALUES = [
  {
    icon: Layers,
    title: "One system, every dimension of life",
    body: "Spiritual, personal, and societal growth — planned and tracked in one place, instead of scattered across a dozen apps.",
  },
  {
    icon: TrendingUp,
    title: "Built for consistency, not motivation",
    body: "Habits, focus sessions, and a life score that reflects what you actually did — not what you meant to do.",
  },
  {
    icon: ShieldCheck,
    title: "Private where it matters",
    body: "A separate, access-gated Recovery Center — never mixed into your dashboard, reports, or analytics.",
  },
];

export function ValueProps() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <SectionHeader
        eyebrow="Why Mastery"
        heading="Purpose-driven, not feature-driven."
        description="Every part of the system exists to move you from intention to action."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="border-border bg-surface-raised rounded-2xl border p-7">
            <div className="bg-gold-subtle mb-5 flex size-11 items-center justify-center rounded-xl">
              <Icon className="text-accent size-5" aria-hidden="true" />
            </div>
            <h3 className="text-foreground text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-muted mt-2 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

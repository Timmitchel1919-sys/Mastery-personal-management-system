import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui";

export function AiSection() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-primary mb-4 text-xs font-semibold tracking-[0.08em] uppercase">
            Personalization
          </p>
          <h2 className="text-foreground max-w-lg text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            An assistant grounded in your own record — not a chatbot with opinions.
          </h2>
          <p className="text-muted mt-5 max-w-lg text-base leading-relaxed sm:text-lg">
            Mastery&rsquo;s AI reads your goals, focus history, and habits to surface a weekly
            summary and a handful of concrete next steps — never generic advice, always tied to what
            you&rsquo;ve actually logged.
          </p>
        </div>

        <GlassCard className="p-7">
          <div className="text-subtle mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="text-primary size-4" aria-hidden="true" />
            Weekly summary
          </div>
          <p className="text-foreground text-base leading-relaxed">
            &ldquo;You closed 5 of 6 weekly goals and held a 12-day habit streak — your strongest
            week this quarter. Deep work sessions ran longest on Tuesday and Thursday
            mornings.&rdquo;
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

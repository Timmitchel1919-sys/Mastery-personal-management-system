import { Reveal } from "./Reveal";

const PRINCIPLES = [
  {
    title: "Intentional, not reactive",
    body: "Decide what matters before the day decides for you. Every task traces back to a goal, every goal to a longer view.",
  },
  {
    title: "Disciplined, not motivated",
    body: "Systems outlast enthusiasm. Mastery is built for the ordinary week — the one where you show up anyway.",
  },
  {
    title: "Effective, not busy",
    body: "Output over activity. The measure is progress you can see, not hours you can count.",
  },
];

/**
 * The philosophy behind Mastery — serious and concise. Not about doing more; about
 * doing what matters, consistently.
 */
export function Philosophy() {
  return (
    <section id="philosophy" className="mx-auto max-w-4xl px-4 py-24 sm:py-32">
      <Reveal>
        <p className="text-eyebrow">Philosophy</p>
        <h2 className="text-foreground mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Mastery is not about doing more.
        </h2>
        <p className="text-muted mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
          It is about becoming more intentional, more disciplined, and more effective — so
          that your days add up to the life you actually intended.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {PRINCIPLES.map((principle, index) => (
          <Reveal key={principle.title} delay={index * 70}>
            <div className="border-border-subtle border-t pt-5">
              <h3 className="text-foreground text-sm font-semibold tracking-tight">
                {principle.title}
              </h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{principle.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

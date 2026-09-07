import { SectionHeader } from "@/components/ui";

const PILLARS = [
  { name: "Spiritual", sub: "Purpose" },
  { name: "Personal", sub: "Growth" },
  { name: "Societal", sub: "Impact" },
];

/**
 * The three life pillars, drawn as one interconnected system branching from
 * MASTERY — gold is the only connecting accent; the nodes stay glass, not colorful.
 */
export function Framework() {
  return (
    <div id="framework" className="mx-auto max-w-4xl px-4 py-24 sm:py-32">
      <SectionHeader
        eyebrow="The life mastery framework"
        heading="Three dimensions. One system."
        description="Mastery treats spiritual, personal, and societal growth as one connected practice, not three separate apps."
      />

      <div className="mt-16 flex flex-col items-center">
        <div className="mastery-glass rounded-2xl px-6 py-3">
          <span className="text-foreground text-sm font-semibold tracking-[0.08em] uppercase">
            Mastery
          </span>
        </div>
        <div className="bg-primary/50 h-10 w-px" aria-hidden="true" />

        <div className="relative w-full max-w-xl">
          <div
            aria-hidden="true"
            className="bg-primary/50 absolute top-0 right-[16.67%] left-[16.67%] h-px"
          />
          <div className="grid grid-cols-3 gap-4 pt-0 sm:gap-8">
            {PILLARS.map((pillar) => (
              <div key={pillar.name} className="flex flex-col items-center">
                <div className="bg-primary/50 h-8 w-px" aria-hidden="true" />
                <div className="mastery-glass flex w-full flex-col items-center gap-1 rounded-2xl px-3 py-5 text-center sm:px-5">
                  <span className="text-foreground text-sm font-semibold sm:text-base">
                    {pillar.name}
                  </span>
                  <span className="text-subtle text-xs tracking-wide uppercase">{pillar.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cinematic mountain atmosphere behind the hero — the journey toward a higher
 * destination. The approved photo lives at `public/mountain-hero.jpg`; until it is
 * dropped in, the layout is unchanged and the warm `.mastery-ambient` gold glow shows
 * through on its own. The mountain is the environment, never the primary UI element:
 * an ivory gradient washes it toward the content so text and the product preview stay
 * dominant.
 */
export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Fallback / base: near-subliminal warm lighting. */}
      <div className="mastery-ambient absolute inset-0" />

      {/* The mountain photo (drop `public/mountain-hero.jpg` in to enable). */}
      <div
        className="absolute inset-x-0 top-0 h-[85%] bg-cover bg-top bg-no-repeat opacity-90 dark:opacity-30"
        style={{
          backgroundImage: "url('/mountain-hero.jpg')",
          maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
        }}
      />

      {/* Ivory wash — keeps the peaks visible but never louder than the headline. */}
      <div className="from-background/25 via-background/55 to-background absolute inset-0 bg-gradient-to-b" />
      <div className="from-background/40 absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent" />
    </div>
  );
}

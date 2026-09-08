import { Logo } from "@/components/ui";

interface MasteryCenterProps {
  displayName: string;
}

/**
 * The central anchor of the constellation — the six modules surround it. Holds the
 * Mastery mark and "YOUR MASTERY" with restrained gold lighting (CSS only, via
 * `.mastery-center`). No human photo, no simulated 3D — a calm focal point.
 */
export function MasteryCenter({ displayName }: MasteryCenterProps) {
  return (
    <section
      aria-label="Your Mastery"
      className="mastery-center flex h-full flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <span className="border-border-gold bg-surface-raised inline-flex size-20 items-center justify-center rounded-full border">
        <Logo variant="mark" height={24} withLabel={false} />
      </span>
      <div className="space-y-1">
        <p className="text-eyebrow">Your Mastery</p>
        <p className="text-foreground text-sm font-medium">{displayName}</p>
      </div>
      <p className="text-subtle max-w-[15rem] text-xs leading-relaxed">
        Every module here turns your long-term vision into what you do today.
      </p>
    </section>
  );
}

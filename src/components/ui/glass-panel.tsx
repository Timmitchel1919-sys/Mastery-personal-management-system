import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * - `default` — the standard restrained glass surface.
   * - `elevated` — the same surface with a deeper shadow for floating panels.
   * - `interactive` — adds a hover lift + gold border; use for clickable cards.
   * - `gold-accent` — a faint gold edge (`.mastery-glass--gold`).
   * - `subtle` — a lighter, less prominent glass for secondary surfaces.
   */
  variant?: "default" | "elevated" | "interactive" | "gold-accent" | "subtle";
}

const VARIANT: Record<NonNullable<GlassPanelProps["variant"]>, string> = {
  default: "",
  elevated: "shadow-[var(--shadow-lg)]",
  interactive:
    "transition-[transform,border-color] duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  "gold-accent": "mastery-glass--gold",
  subtle: "bg-surface/40",
};

/**
 * Restrained glassmorphism surface — navigation, auth cards, floating panels,
 * modals, toasts, feature/preview cards. Reserve for the handful of surfaces the
 * design system calls out; dense, scannable content (tables, forms, dashboard
 * cards) stays on the flat `Card` surface. Falls back to an opaque fill when the
 * browser has no `backdrop-filter` support (see `globals.css`).
 */
export function GlassPanel({ className, variant = "default", ...props }: GlassPanelProps) {
  return (
    <div className={cn("mastery-glass rounded-3xl", VARIANT[variant], className)} {...props} />
  );
}

/** A `GlassPanel` shaped like `Card` (rounded corners + generous padding) — the
 * glass counterpart used for auth cards and elevated feature cards. */
export function GlassCard({ className, variant = "default", ...props }: GlassPanelProps) {
  return (
    <div
      className={cn("mastery-glass rounded-3xl p-6", VARIANT[variant], className)}
      {...props}
    />
  );
}

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

/**
 * Restrained glassmorphism surface — navigation, auth cards, floating panels,
 * modals, toasts, feature/preview cards. Reserve for the handful of surfaces the
 * design system calls out; dense, scannable content (tables, forms, dashboard
 * cards) stays on the flat `Card` surface. Falls back to an opaque fill when the
 * browser has no `backdrop-filter` support (see `globals.css`).
 */
export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return <div className={cn("mastery-glass rounded-3xl", className)} {...props} />;
}

/** A `GlassPanel` shaped like `Card` (rounded corners + generous padding) — the
 * glass counterpart used for auth cards and elevated feature cards. */
export function GlassCard({ className, ...props }: GlassPanelProps) {
  return <div className={cn("mastery-glass rounded-3xl p-6", className)} {...props} />;
}

import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleCardProps {
  name: string;
  purpose: string;
  href: string;
  icon: LucideIcon;
  tier?: "secondary" | "tertiary";
  className?: string;
}

/**
 * One core module in the dashboard constellation. The whole card is a single link;
 * depth (layered shadow, inset highlight, hover lift) is CSS-only via
 * `.mastery-module-card` and honours `prefers-reduced-motion`.
 */
export function ModuleCard({
  name,
  purpose,
  href,
  icon: Icon,
  tier = "tertiary",
  className,
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      aria-label={`${name} — ${purpose}`}
      className={cn(
        "mastery-module-card group focus-visible:ring-ring p-5 outline-none focus-visible:ring-2",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl border transition-colors",
            tier === "secondary"
              ? "border-border-gold bg-gold-subtle text-accent"
              : "border-border bg-surface text-muted group-hover:text-accent",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="text-subtle size-4 transition-colors group-hover:text-accent"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-foreground mt-3 text-base font-semibold tracking-tight">{name}</h3>
      <p className="text-muted mt-0.5 text-sm leading-snug">{purpose}</p>
    </Link>
  );
}

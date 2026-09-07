import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  /** Small label above the heading, e.g. "HOW MASTERY WORKS". */
  eyebrow?: ReactNode;
  heading: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Eyebrow + heading + description block used to open a landing-page section. */
export function SectionHeader({
  eyebrow,
  heading,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-primary text-xs font-semibold tracking-[0.08em] uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="text-foreground max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {heading}
      </h2>
      {description ? (
        <p className="text-muted max-w-xl text-base leading-relaxed text-balance sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

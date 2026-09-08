"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SubmoduleDef } from "../module-registry";

/**
 * One submodule inside a module environment. Uses the shared
 * `.mastery-module-card` language (obsidian base, thin border, restrained gold,
 * CSS-only depth) — the same component family as the dashboard, so the visual
 * relationship Brain → Module → Submodule holds. It is a real `<Link>` to the
 * existing route; nothing is rebuilt.
 */
export function SubmoduleCard({ submodule }: { submodule: SubmoduleDef }) {
  return (
    <Link
      href={submodule.href}
      aria-label={`Open ${submodule.title}`}
      className="mastery-module-card group focus-visible:ring-ring h-full p-5 outline-none focus-visible:ring-2"
    >
      <div className="flex items-start justify-between">
        <span className="border-border bg-surface text-muted group-hover:text-accent inline-flex size-10 items-center justify-center rounded-xl border transition-colors">
          <submodule.icon className="size-5" aria-hidden="true" />
        </span>
        {!submodule.available ? (
          <span className="text-subtle text-[0.6875rem] font-medium tracking-wide uppercase">
            Coming soon
          </span>
        ) : null}
      </div>

      <h3 className="text-foreground mt-3 text-base font-semibold tracking-tight">
        {submodule.title}
      </h3>
      {submodule.description ? (
        <p className="text-muted mt-0.5 text-sm leading-snug">{submodule.description}</p>
      ) : null}

      <span className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium">
        Open
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

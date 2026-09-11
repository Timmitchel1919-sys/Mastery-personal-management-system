"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  CONTEXT_CONFIDENCE_LABEL,
  CONTEXT_RELEVANCE_LABEL,
  explainRelevance,
  type ContextQuery,
  type ContextRelevance,
} from "../context-model";
import { useKnowledgeContext } from "../use-context";

const RELEVANCE_STYLE: Record<ContextRelevance, string> = {
  direct: "text-primary",
  high: "text-success",
  medium: "text-muted",
  low: "text-subtle",
  irrelevant: "text-subtle",
};

interface RelevantContextPanelProps {
  scope: Omit<ContextQuery, "now" | "limit">;
  title?: string;
  limit?: number;
  className?: string;
  /** Compact hides the explanation line and the mark-irrelevant control. */
  compact?: boolean;
}

/**
 * A reusable, scoped "what history is relevant here" panel. Deterministic
 * relevance, an explicit reason on every row, an "open source" link, and a
 * "not relevant" control that the engine honours. Renders "No relevant history
 * found." rather than guessing.
 */
export function RelevantContextPanel({
  scope,
  title = "Relevant context",
  limit = 6,
  className,
  compact = false,
}: RelevantContextPanelProps) {
  const { status, query, userContext } = useKnowledgeContext();

  const results = useMemo(
    () => (status === "ready" ? query({ ...scope, limit }) : []),
    [status, query, scope, limit],
  );

  return (
    <section
      aria-labelledby="relevant-context-heading"
      className={cn("mastery-panel space-y-3 rounded-2xl p-5", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="relevant-context-heading" className="text-eyebrow flex items-center gap-1.5">
          <BookOpen className="size-3.5" aria-hidden="true" />
          {title}
        </h2>
        {!compact ? (
          <Button asChild size="sm" variant="ghost">
            <Link href="/knowledge">Knowledge Hub</Link>
          </Button>
        ) : null}
      </div>

      {status !== "ready" ? (
        <p className="text-muted text-sm">Loading context…</p>
      ) : results.length === 0 ? (
        <p className="text-muted text-sm">No relevant history found.</p>
      ) : (
        <ul className="divide-border divide-y">
          {results.map((result) => (
            <li key={result.item.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-[0.625rem] font-semibold tracking-[0.08em] uppercase",
                      RELEVANCE_STYLE[result.relevance],
                    )}
                  >
                    {CONTEXT_RELEVANCE_LABEL[result.relevance]}
                  </span>
                  <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
                    {result.item.type} · {CONTEXT_CONFIDENCE_LABEL[result.item.confidence]}
                  </span>
                </div>
                <Link href={result.item.href} className="text-foreground block truncate text-sm hover:underline">
                  {result.item.title}
                </Link>
                {!compact ? (
                  <p className="text-subtle text-xs">{explainRelevance(result)}</p>
                ) : null}
              </div>
              {!compact ? (
                <button
                  type="button"
                  onClick={() => userContext.markIrrelevant(result.item.sourceId)}
                  className="text-subtle hover:text-foreground shrink-0 rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Mark "${result.item.title}" not relevant`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

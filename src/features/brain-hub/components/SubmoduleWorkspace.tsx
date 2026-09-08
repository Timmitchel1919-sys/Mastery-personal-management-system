"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { BrainModuleId } from "../brain-modules";
import { moduleDef, submoduleDef } from "../module-registry";

type WorkspaceState = "loading" | "ready" | "empty" | "error";

interface SubmoduleWorkspaceProps {
  module: BrainModuleId;
  /** Last path segment, e.g. "time-blocking". Must exist in the module registry. */
  submoduleId: string;
  /**
   * The existing feature component. It keeps its own data, hooks, forms, and
   * validation — this shell never touches business logic, and by default the
   * feature keeps its own page header, loading, empty, and error states.
   */
  children?: ReactNode;
  /** Right-aligned header actions — pass only what the existing feature supports. */
  actions?: ReactNode;
  /**
   * Set only when the shell should own the title (e.g. a placeholder submodule
   * with no rich feature). Left unset, the wrapped feature's own header stands.
   */
  title?: string;
  description?: string;
  /** Shell-owned state. Defaults to `ready` — the feature owns its own states. */
  state?: WorkspaceState;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * The consistent workspace shell for a submodule: Brain-hierarchy back
 * navigation, a subtle MODULE / SUBMODULE breadcrumb, and a small module
 * identity mark linking back toward the brain — wrapped around an existing
 * feature. Independent of business logic.
 *
 * `← Back` and ESC both return to the module environment (never the app root);
 * ESC yields to an open dialog so it can't steal a modal's Escape.
 */
export function SubmoduleWorkspace({
  module,
  submoduleId,
  children,
  actions,
  title,
  description,
  state = "ready",
  emptyTitle,
  emptyDescription,
  emptyAction,
  errorMessage,
  onRetry,
  className,
}: SubmoduleWorkspaceProps) {
  const router = useRouter();
  const mod = moduleDef(module);
  const sub = submoduleDef(module, submoduleId);
  const ModuleIcon = mod.icon;
  const backHref = mod.href;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      router.push(backHref);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, backHref]);

  return (
    <div className={cn("w-full", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href={backHref} aria-label={`Back to ${mod.title}`}>
              <ArrowLeft aria-hidden="true" />
              Back to {mod.title}
            </Link>
          </Button>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>

        <div className="mt-3 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="border-border-gold bg-gold-subtle text-accent relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl border"
          >
            <ModuleIcon className="size-5" />
            <span className="bg-gold-connector absolute top-1/2 -left-3 h-px w-3" />
          </span>
          <div className="min-w-0">
            <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
              <span>{mod.title}</span>
              <span className="text-border-strong"> / </span>
              <span>{sub.title}</span>
            </p>
            {title ? (
              <h1 className="text-foreground mt-0.5 text-2xl font-semibold tracking-tight">
                {title}
              </h1>
            ) : null}
            {description ? <p className="text-muted mt-0.5 text-sm">{description}</p> : null}
          </div>
        </div>
      </div>

      {state === "loading" ? (
        <div className="mx-auto mt-6 w-full max-w-6xl space-y-4 px-4 sm:px-6" aria-hidden="true">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : state === "error" ? (
        <div className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6">
          <ErrorState
            title={`Unable to load ${sub.title}`}
            description={errorMessage ?? "Please try again."}
            onRetry={onRetry}
          />
        </div>
      ) : state === "empty" ? (
        <div className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6">
          <EmptyState
            title={emptyTitle ?? `No ${sub.title.toLowerCase()} yet`}
            description={emptyDescription ?? "There is nothing here yet."}
            action={emptyAction}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/shared";
import { IntelligencePanel } from "@/features/intelligence";
import type { BrainHubPhase, BrainModuleId } from "../brain-navigation";
import { moduleDef } from "../module-registry";
import { SubmoduleCard } from "./SubmoduleCard";

interface ModuleEnvironmentProps {
  moduleId: BrainModuleId;
  /** From the shared camera state machine — drives the enter pulse. */
  phase: BrainHubPhase;
  /** Return to the Brain Hub. */
  onBack: () => void;
  /** Open the module's full overview route. */
  onOpenModule: () => void;
  /** Optional error text — module data is not owned here, callers supply it. */
  error?: string | null;
  onRetry?: () => void;
}

/**
 * A reusable presentation shell for a module's environment: a Back control, the
 * module header, and its submodules as cards. It contains no module-specific
 * business logic — everything comes from the `module-registry` adapter and the
 * cards are plain links into the existing routes.
 */
export function ModuleEnvironment({
  moduleId,
  phase,
  onBack,
  onOpenModule,
  error,
  onRetry,
}: ModuleEnvironmentProps) {
  const mod = moduleDef(moduleId);
  const Icon = mod.icon;
  const settling = phase === "transitioning";

  return (
    <section aria-labelledby="module-env-title" className="space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button size="sm" variant="ghost" onClick={onBack} aria-label="Back to Brain Hub">
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenModule}>
            Open {mod.title}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-start gap-3">
          <span className="border-border-gold bg-gold-subtle text-accent inline-flex size-11 shrink-0 items-center justify-center rounded-xl border">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="module-env-title" className="text-foreground text-2xl font-semibold tracking-tight">
              {mod.title}
            </h2>
            <p className="text-muted mt-0.5 text-sm">{mod.description}</p>
          </div>
        </div>
      </header>

      {error ? (
        <ErrorState
          title={`Unable to load ${mod.title}`}
          description="Please try again."
          onRetry={onRetry}
        />
      ) : settling ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : mod.submodules.length === 0 ? (
        <EmptyState
          title={`No ${mod.title.toLowerCase()} areas yet`}
          description="This module's areas will appear here as they become available."
          action={
            <Button asChild size="sm">
              <Link href={mod.href}>Open {mod.title}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="mastery-expand grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mod.submodules.map((submodule) => (
              <li key={submodule.id} className="min-w-0">
                <SubmoduleCard submodule={submodule} />
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <IntelligencePanel variant="compact" moduleId={moduleId} limit={2} />
          </div>
        </>
      )}
    </section>
  );
}

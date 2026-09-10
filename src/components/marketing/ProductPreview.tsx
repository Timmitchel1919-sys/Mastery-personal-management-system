"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Workflow } from "lucide-react";
import { Button, SectionHeader } from "@/components/ui";
import { MODULE_REGISTRY, type BrainModuleId } from "@/features/brain-hub";
import { Reveal } from "./Reveal";
import { MARKETING_MODULES, MARKETING_MODULE_BY_ID } from "./marketing-modules";

/**
 * Read-only product walkthrough using real module metadata and real routes.
 * This section intentionally does not emulate writable app state.
 */
export function ProductPreview() {
  const [selectedId, setSelectedId] = useState<BrainModuleId>(MARKETING_MODULES[0]?.id ?? "goals");
  const selectedModule = useMemo(() => MARKETING_MODULE_BY_ID[selectedId], [selectedId]);
  const moduleRegistry = MODULE_REGISTRY[selectedId];

  return (
    <section id="preview" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeader
          eyebrow="Interactive Product Preview"
          heading="Explore the real MASTERY environment"
          description="Select a system to preview how Brain Hub leads to module context, submodule paths, and workspace execution."
        />
      </Reveal>

      <Reveal delay={120} className="mt-14">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="mastery-glass rounded-2xl p-4 sm:p-5">
            <p className="text-eyebrow">Select a system</p>
            <div className="mt-3 flex flex-col gap-2" role="tablist" aria-label="Mastery systems">
              {MARKETING_MODULES.map((module) => {
                const Icon = module.icon;
                const selected = selectedId === module.id;
                return (
                  <button
                    key={module.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`preview-panel-${module.id}`}
                    id={`preview-tab-${module.id}`}
                    onClick={() => setSelectedId(module.id)}
                    className="mastery-card data-[selected=true]:border-border-gold data-[selected=true]:bg-section flex items-start gap-3 rounded-xl p-3 text-left"
                    data-selected={selected || undefined}
                  >
                    <span className="bg-gold-subtle text-accent inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-foreground block text-sm font-semibold tracking-tight">
                        {module.name}
                      </span>
                      <span className="text-muted block text-xs leading-relaxed">{module.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <article
            id={`preview-panel-${selectedId}`}
            role="tabpanel"
            aria-labelledby={`preview-tab-${selectedId}`}
            className="mastery-glass mastery-glass--gold rounded-2xl p-4 sm:p-6"
          >
            <div className="border-border-subtle mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
              <span className="text-subtle text-xs font-semibold tracking-[0.09em] uppercase">
                Brain Hub
              </span>
              <span className="text-subtle text-xs">/</span>
              <span className="text-foreground text-xs font-semibold tracking-[0.09em] uppercase">
                {selectedModule.name}
              </span>
              <span className="text-subtle text-xs">/</span>
              <span className="text-muted text-xs">Workspace Preview</span>
              <span className="border-border-subtle bg-section text-subtle ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                <Lock className="size-3" aria-hidden="true" />
                Read-only
              </span>
            </div>

            <h3 className="text-foreground text-xl font-semibold tracking-tight">{selectedModule.name}</h3>
            <p className="text-muted mt-2 text-sm leading-relaxed">{selectedModule.longDescription}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <section className="mastery-card rounded-xl p-4">
                <p className="text-eyebrow mb-2 flex items-center gap-1.5">
                  <Workflow className="size-3.5" aria-hidden="true" />
                  Start Here
                </p>
                <ul className="space-y-2">
                  {moduleRegistry.submodules.slice(0, 4).map((submodule) => (
                    <li key={submodule.id} className="flex items-start gap-2 text-sm">
                      <span className="bg-border-strong mt-1.5 inline-block size-1.5 shrink-0 rounded-full" />
                      <span className="text-muted leading-relaxed">{submodule.title}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mastery-card rounded-xl p-4">
                <p className="text-eyebrow mb-2">What this system does</p>
                <ul className="space-y-2">
                  {selectedModule.previewBullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm">
                      <span className="bg-border-strong mt-1.5 inline-block size-1.5 shrink-0 rounded-full" />
                      <span className="text-muted leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={selectedModule.ctaHref}>
                  Start with MASTERY
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={moduleRegistry.href}>Open {selectedModule.name} route</Link>
              </Button>
            </div>
          </article>
        </div>
      </Reveal>

      <Reveal delay={180} className="mt-6">
        <p className="text-subtle text-center text-xs leading-relaxed">
          Preview links use real routes. Protected module routes may redirect to the existing
          authentication flow when signed out.
        </p>
      </Reveal>
    </section>
  );
}

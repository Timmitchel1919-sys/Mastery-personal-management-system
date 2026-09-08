"use client";

import { useId, useMemo } from "react";
import { useRouter } from "next/navigation";
import { NAV_SECTIONS } from "@/config/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import {
  BRAIN_MODULES,
  brainModule,
  useBrainNavigation,
  type BrainModule,
  type BrainModuleId,
  type BrainModuleStatus,
} from "../brain-navigation";
import { supportsWebgl } from "../webgl";
import { BrainFallbackList } from "./BrainFallbackList";
import { BrainModulePreview } from "./BrainModulePreview";
import { BrainNode } from "./BrainNode";
import { BrainScene } from "./BrainScene";
import { ModuleEnvironment } from "./ModuleEnvironment";

interface BrainHubProps {
  /** Where "open the selected module" navigates. Defaults to the module route.
   * Layer C replaces this with the full module environment. */
  onOpen?: (module: BrainModule) => void;
  /** Real per-module status, keyed by id. Omit entirely if the app has none —
   * nothing is fabricated. */
  statusById?: Partial<Record<BrainModuleId, BrainModuleStatus>>;
  initialSelectedId?: BrainModuleId | null;
  className?: string;
}

/** Node distance from the core, as a % of the stage half-size. Tighter on tablet. */
const NODE_RADIUS_DESKTOP = 40;
const NODE_RADIUS_TABLET = 34;

/** Submodule labels per module, straight from the nav config (not business logic). */
const PREVIEW_ITEMS: Record<BrainModuleId, string[]> = BRAIN_MODULES.reduce(
  (acc, module) => {
    const section = NAV_SECTIONS.find((s) => s.id === module.id);
    acc[module.id] = section ? section.items.map((item) => item.label) : [];
    return acc;
  },
  {} as Record<BrainModuleId, string[]>,
);

/**
 * The Mastery Brain Hub — spatial navigation for the six systems. It owns the
 * navigation state (via `useBrainNavigation`) and the composition, and delegates
 * all rendering to the swappable `BrainScene`. Selecting a module starts a
 * camera transition and makes that module dominant; it never navigates away —
 * only the explicit "Open" action does. ESC returns toward the brain.
 *
 * The topbar and sidebar are untouched; this is still an additive surface.
 */
export function BrainHub({
  onOpen,
  statusById,
  initialSelectedId = null,
  className,
}: BrainHubProps) {
  const router = useRouter();
  const mounted = useMounted();
  const isWide = useMediaQuery("(min-width: 768px)", true);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const previewBaseId = useId();

  const nav = useBrainNavigation({
    initialSelectedId,
    reducedMotion,
    onOpen: onOpen ?? ((module) => router.push(module.href)),
  });

  const spatial = useMemo(
    () => mounted && isWide && supportsWebgl(),
    [mounted, isWide],
  );
  const nodeRadius = isDesktop ? NODE_RADIUS_DESKTOP : NODE_RADIUS_TABLET;
  const engaged = nav.phase !== "home" && nav.selectedId != null;
  const selectedModule = nav.selectedId ? brainModule(nav.selectedId) : null;
  // The hover preview is suppressed once a module is engaged — its context takes over.
  const previewId = !engaged ? nav.activeId : null;

  // Engaged: a compact brain stays visible for continuity, with the module
  // environment below it. The camera transition (Layer B) plays on the brain.
  if (engaged && selectedModule) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div
          aria-hidden="true"
          className="brain-stage relative mx-auto aspect-square w-28 sm:w-32"
          data-phase={nav.phase}
        >
          <BrainScene
            activeId={nav.selectedId}
            selectedId={nav.selectedId}
            phase={nav.phase}
            nodeRadius={0}
            reducedMotion={reducedMotion}
          />
        </div>
        <ModuleEnvironment
          moduleId={selectedModule.id}
          phase={nav.phase}
          onBack={nav.returnHome}
          onOpenModule={nav.openSelected}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {spatial ? (
        <>
          <div
            role="group"
            aria-label="Mastery Brain — spatial module navigation"
            data-phase={nav.phase}
            className="relative mx-auto aspect-square w-full max-w-136"
          >
            <BrainScene
              activeId={nav.activeId}
              selectedId={nav.selectedId}
              phase={nav.phase}
              nodeRadius={nodeRadius}
              reducedMotion={reducedMotion}
            />
            {BRAIN_MODULES.map((module) => (
              <BrainNode
                key={module.id}
                module={module}
                radius={nodeRadius}
                selected={nav.selectedId === module.id}
                dimmed={engaged && nav.selectedId !== module.id}
                status={statusById?.[module.id]}
                previewId={`${previewBaseId}-${module.id}`}
                previewOpen={previewId === module.id}
                onSelect={() => nav.enterModule(module.id)}
                onActivate={() => nav.setActive(module.id)}
                onDeactivate={() => nav.setActive(null)}
              />
            ))}
            {previewId ? (
              <BrainModulePreview
                id={`${previewBaseId}-${previewId}`}
                module={brainModule(previewId)}
                items={PREVIEW_ITEMS[previewId]}
                radius={nodeRadius}
              />
            ) : null}
          </div>
          <BrainFallbackList selectedId={nav.selectedId} onSelect={nav.enterModule} />
        </>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="brain-stage relative aspect-square w-40 sm:w-48">
            <BrainScene
              activeId={nav.activeId}
              selectedId={nav.selectedId}
              phase={nav.phase}
              nodeRadius={0}
              reducedMotion={reducedMotion}
            />
          </div>
          <BrainFallbackList
            selectedId={nav.selectedId}
            onSelect={nav.enterModule}
            primary
            className="w-full max-w-md"
          />
        </div>
      )}
    </div>
  );
}

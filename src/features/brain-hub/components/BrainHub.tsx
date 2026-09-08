"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import {
  BRAIN_MODULES,
  useBrainNavigation,
  type BrainModule,
  type BrainModuleId,
} from "../brain-navigation";
import { supportsWebgl } from "../webgl";
import { BrainFallbackList } from "./BrainFallbackList";
import { BrainNode } from "./BrainNode";
import { BrainScene } from "./BrainScene";

interface BrainHubProps {
  /** Override what "select" does. Defaults to navigating to the module route.
   * Layer B replaces this with the zoom/submodule transition. */
  onSelect?: (module: BrainModule) => void;
  initialSelectedId?: BrainModuleId | null;
  className?: string;
}

/** Node distance from the core, as a % of the stage half-size. */
const NODE_RADIUS = 40;

/**
 * The Mastery Brain Hub — the future primary navigation surface. It owns the
 * navigation state and the spatial composition, and delegates all rendering to
 * the swappable `BrainScene`. It never touches auth, data, or module business
 * logic; selection just emits a `BrainModule` (default: navigate to its route).
 *
 * The existing sidebar and topbar remain the real navigation for now — this is
 * an additive surface with a stable API for Layer B.
 */
export function BrainHub({ onSelect, initialSelectedId = null, className }: BrainHubProps) {
  const router = useRouter();
  const mounted = useMounted();
  const isWide = useMediaQuery("(min-width: 768px)", true);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);

  const nav = useBrainNavigation({
    initialSelectedId,
    onSelect: onSelect ?? ((module) => router.push(module.href)),
  });

  // Spatial layout is viable only with WebGL-class rendering, a wide viewport,
  // and after mount (SSR has no capability info). Otherwise the list is primary.
  const spatial = useMemo(
    () => mounted && isWide && supportsWebgl(),
    [mounted, isWide],
  );

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {spatial ? (
        <>
          {/* Spatial composition — nodes orbit the brain core. */}
          <div
            role="group"
            aria-label="Mastery Brain — module navigation"
            className="relative mx-auto aspect-square w-full max-w-136"
          >
            <BrainScene
              activeId={nav.activeId}
              selectedId={nav.selectedId}
              nodeRadius={NODE_RADIUS}
              reducedMotion={reducedMotion}
            />
            {BRAIN_MODULES.map((module) => (
              <BrainNode
                key={module.id}
                module={module}
                radius={NODE_RADIUS}
                selected={nav.selectedId === module.id}
                onSelect={() => nav.select(module.id)}
                onActivate={() => nav.setActive(module.id)}
                onDeactivate={() => nav.setActive(null)}
              />
            ))}
          </div>
          {/* Assistive-tech equivalent of the spatial nodes. */}
          <BrainFallbackList selectedId={nav.selectedId} onSelect={nav.select} />
        </>
      ) : (
        // Mobile / no-WebGL / reduced-capability: brain stays the anchor, list navigates.
        <div className="flex flex-col items-center gap-6">
          <div className="brain-stage relative aspect-square w-40 sm:w-48">
            <BrainScene
              activeId={nav.activeId}
              selectedId={nav.selectedId}
              nodeRadius={0}
              reducedMotion={reducedMotion}
            />
          </div>
          <BrainFallbackList
            selectedId={nav.selectedId}
            onSelect={nav.select}
            primary
            className="w-full max-w-md"
          />
        </div>
      )}
    </div>
  );
}

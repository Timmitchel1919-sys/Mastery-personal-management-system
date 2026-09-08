import type { LucideIcon } from "lucide-react";
import { NAV_SECTIONS } from "@/config/navigation";
import { MODULE_OVERVIEW } from "@/config/module-overview";
import { BRAIN_MODULES, type BrainModuleId } from "./brain-modules";

/**
 * The module registry — the single source of navigation metadata for the
 * Brain → Module → Submodule flow. It does not define anything new: it is a thin
 * adapter over the existing configs
 *
 *   BRAIN_MODULES      (id / title / icon / route)      — Layers A–B
 *   NAV_SECTIONS        (the real submodule list + routes)
 *   MODULE_OVERVIEW     (one-line purpose per submodule)  — Layer 7
 *
 * so module definitions are never duplicated across components. Every `href`
 * here is an existing application route.
 *
 * Pure module — no React, no I/O. Covered by module-registry.test.ts.
 */

export interface SubmoduleDef {
  /** Last path segment, e.g. "deep-work". */
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Existing route. */
  href: string;
  /** False only when the target is a known not-yet-built placeholder screen. */
  available: boolean;
}

export interface ModuleDef {
  id: BrainModuleId;
  title: string;
  /** Short "what this environment is for" line. */
  description: string;
  icon: LucideIcon;
  /** The module overview route. */
  href: string;
  submodules: SubmoduleDef[];
}

/** Routes still served by `ModulePlaceholder` (see the Layer 7 audit). */
const PLACEHOLDER_ROUTES = new Set<string>(["/focus/sessions"]);

const MODULE_DESCRIPTION: Record<BrainModuleId, string> = {
  goals: "Turn direction into measurable outcomes.",
  plan: "Decide what matters and organise your time.",
  focus: "Protect your attention and do meaningful work.",
  act: "Execute what you planned.",
  grow: "Build knowledge, skills, habits and character.",
  analytics: "Understand your patterns and progress.",
};

function slug(href: string): string {
  return href.split("/").filter(Boolean).at(-1) ?? href;
}

export const MODULE_REGISTRY: Record<BrainModuleId, ModuleDef> = BRAIN_MODULES.reduce(
  (registry, module) => {
    const section = NAV_SECTIONS.find((entry) => entry.id === module.id);
    const overview = MODULE_OVERVIEW[module.id];

    const submodules: SubmoduleDef[] = (section?.items ?? []).map((item) => ({
      id: slug(item.href),
      title: item.label,
      description: overview?.descriptions[item.href] ?? item.description ?? "",
      icon: item.icon,
      href: item.href,
      available: !PLACEHOLDER_ROUTES.has(item.href),
    }));

    registry[module.id] = {
      id: module.id,
      title: module.label,
      description: MODULE_DESCRIPTION[module.id],
      icon: module.icon,
      href: module.href,
      submodules,
    };
    return registry;
  },
  {} as Record<BrainModuleId, ModuleDef>,
);

export function moduleDef(id: BrainModuleId): ModuleDef {
  const found = MODULE_REGISTRY[id];
  if (!found) throw new Error(`Unknown module: ${id}`);
  return found;
}

export function submoduleDef(moduleId: BrainModuleId, submoduleId: string): SubmoduleDef {
  const found = moduleDef(moduleId).submodules.find((sub) => sub.id === submoduleId);
  if (!found) throw new Error(`Unknown submodule: ${moduleId}/${submoduleId}`);
  return found;
}

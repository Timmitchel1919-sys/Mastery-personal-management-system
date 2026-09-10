import {
  BarChart3,
  CheckSquare,
  Compass,
  Sprout,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { BRAIN_MODULES, MODULE_REGISTRY, type BrainModuleId } from "@/features/brain-hub";

export interface MarketingModule {
  id: BrainModuleId;
  name: string;
  /** Card description on the landing page. */
  blurb: string;
  /** Deeper copy for interactive previews. */
  longDescription: string;
  /** One verb — used in the "system flow" section. */
  action: string;
  /** Existing app destination for this module. */
  route: string;
  /** Auth entry point for preview CTAs. */
  ctaHref: string;
  /** Read-only preview bullets (never promises unsupported behavior). */
  previewBullets: string[];
  /** Existing submodule labels from the real navigation registry. */
  previewSubmodules: string[];
  icon: LucideIcon;
}

/**
 * The six pillars of the Mastery operating system. Copy is marketing-facing, while
 * routes/submodules are sourced from the real app registry so landing and app stay aligned.
 */
const MODULE_ICON: Record<BrainModuleId, LucideIcon> = {
  goals: Target,
  plan: Compass,
  focus: Timer,
  act: CheckSquare,
  grow: Sprout,
  analytics: BarChart3,
};

const MODULE_COPY: Record<
  BrainModuleId,
  {
    blurb: string;
    longDescription: string;
    action: string;
    previewBullets: string[];
  }
> = {
  goals: {
    blurb: "Define what matters and what you want to achieve.",
    longDescription:
      "Goals gives your direction a measurable shape so priorities, projects, and milestones stay connected to outcomes.",
    action: "Define what matters.",
    previewBullets: [
      "Set measurable outcomes before planning tasks.",
      "Connect projects and milestones to real goals.",
      "Keep long-range intent visible in daily decisions.",
    ],
  },
  plan: {
    blurb: "Turn goals into structured action.",
    longDescription:
      "Plan converts intention into weekly and monthly structure so your time reflects your priorities.",
    action: "Design the path.",
    previewBullets: [
      "Break vision into yearly, quarterly, monthly, and weekly plans.",
      "Use the planning cascade to keep execution aligned.",
      "Clarify what to do now and what can wait.",
    ],
  },
  focus: {
    blurb: "Protect attention and execute meaningful work.",
    longDescription:
      "Focus protects your cognitive bandwidth with deliberate sessions, prioritization, and schedule clarity.",
    action: "Protect attention.",
    previewBullets: [
      "Run deep work and Pomodoro sessions.",
      "Prioritize by urgency and importance.",
      "Place focused work blocks inside your real calendar.",
    ],
  },
  act: {
    blurb: "Turn plans into consistent execution.",
    longDescription:
      "Act is where commitments become behavior through tasks, habits, routines, and execution tracking.",
    action: "Execute consistently.",
    previewBullets: [
      "Capture daily tasks and the next best action.",
      "Track habits and routine adherence over time.",
      "Review planned versus completed execution.",
    ],
  },
  grow: {
    blurb: "Build skills, knowledge, and personal capacity.",
    longDescription:
      "Grow turns experience into improvement with reflection, learning, skill development, and coaching support.",
    action: "Develop capacity.",
    previewBullets: [
      "Journal key lessons from your day.",
      "Track learning, reading, and deliberate practice.",
      "Use coaching prompts grounded in your own records.",
    ],
  },
  analytics: {
    blurb: "Understand patterns, progress, and performance.",
    longDescription:
      "Analytics closes the loop with transparent metrics so progress becomes decision intelligence for your next cycle.",
    action: "Measure and improve.",
    previewBullets: [
      "Review KPIs and life-score trends.",
      "Spot patterns across focus, execution, and growth.",
      "Feed insights back into better planning.",
    ],
  },
};

export const MARKETING_MODULES: MarketingModule[] = BRAIN_MODULES.map((module) => {
  const registry = MODULE_REGISTRY[module.id];
  const copy = MODULE_COPY[module.id];
  return {
    id: module.id,
    name: module.label,
    blurb: copy.blurb,
    longDescription: copy.longDescription,
    action: copy.action,
    route: module.href,
    ctaHref: "/register",
    previewBullets: copy.previewBullets,
    previewSubmodules: registry.submodules.slice(0, 3).map((submodule) => submodule.title),
    icon: MODULE_ICON[module.id],
  };
});

export const MARKETING_MODULE_BY_ID: Record<BrainModuleId, MarketingModule> =
  MARKETING_MODULES.reduce(
    (acc, module) => {
      acc[module.id] = module;
      return acc;
    },
    {} as Record<BrainModuleId, MarketingModule>,
  );

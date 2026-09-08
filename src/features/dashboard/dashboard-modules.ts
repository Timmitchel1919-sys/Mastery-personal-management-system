import {
  BarChart3,
  CheckSquare,
  Compass,
  Sprout,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface DashboardModule {
  id: string;
  name: string;
  /** One-line statement of what the module is for. */
  purpose: string;
  href: string;
  icon: LucideIcon;
  /**
   * Composition tier. The PRIMARY anchor is Today's Focus, not a module; PLAN /
   * GOALS / FOCUS read first ("secondary"), ACT / GROW / ANALYTICS follow
   * ("tertiary"). All six carry equal navigational weight — the tier only tunes
   * the visual accent.
   */
  tier: "secondary" | "tertiary";
}

/**
 * The six core modules of the Mastery operating system, in reading order. Hrefs
 * mirror `NAV_SECTIONS` in `@/config/navigation` so the dashboard constellation and
 * the sidebar never drift apart.
 */
export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "plan",
    name: "Plan",
    purpose: "Structure your day.",
    href: "/plan",
    icon: Compass,
    tier: "secondary",
  },
  {
    id: "goals",
    name: "Goals",
    purpose: "Turn direction into measurable outcomes.",
    href: "/plan/goals",
    icon: Target,
    tier: "secondary",
  },
  {
    id: "focus",
    name: "Focus",
    purpose: "Protect your attention.",
    href: "/focus",
    icon: Timer,
    tier: "secondary",
  },
  {
    id: "act",
    name: "Act",
    purpose: "Execute what matters.",
    href: "/act",
    icon: CheckSquare,
    tier: "tertiary",
  },
  {
    id: "grow",
    name: "Grow",
    purpose: "Build capability and character.",
    href: "/grow",
    icon: Sprout,
    tier: "tertiary",
  },
  {
    id: "analytics",
    name: "Analytics",
    purpose: "Understand your trajectory.",
    href: "/analytics",
    icon: BarChart3,
    tier: "tertiary",
  },
];

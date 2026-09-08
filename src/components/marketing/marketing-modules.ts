import {
  BarChart3,
  CheckSquare,
  Compass,
  Sprout,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface MarketingModule {
  id: string;
  name: string;
  /** Card description on the landing page. */
  blurb: string;
  /** One verb — used in the "system flow" section. */
  action: string;
  icon: LucideIcon;
}

/**
 * The six pillars of the Mastery operating system, in loop order. The copy here is
 * marketing-facing; the in-app equivalents live in
 * `@/features/dashboard/dashboard-modules`.
 */
export const MARKETING_MODULES: MarketingModule[] = [
  {
    id: "plan",
    name: "Plan",
    blurb: "Structure your time and priorities.",
    action: "Decide what matters.",
    icon: Compass,
  },
  {
    id: "goals",
    name: "Goals",
    blurb: "Turn ambition into measurable outcomes.",
    action: "Define where you are going.",
    icon: Target,
  },
  {
    id: "focus",
    name: "Focus",
    blurb: "Protect your attention and do meaningful work.",
    action: "Protect your attention.",
    icon: Timer,
  },
  {
    id: "act",
    name: "Act",
    blurb: "Execute what you planned.",
    action: "Execute consistently.",
    icon: CheckSquare,
  },
  {
    id: "grow",
    name: "Grow",
    blurb: "Develop your skills, habits, knowledge and character.",
    action: "Become better.",
    icon: Sprout,
  },
  {
    id: "analytics",
    name: "Analytics",
    blurb: "Understand your progress and trajectory.",
    action: "Measure the journey.",
    icon: BarChart3,
  },
];

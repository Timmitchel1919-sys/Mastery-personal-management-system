import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Clock,
  Compass,
  Dumbbell,
  Flag,
  Flame,
  FolderKanban,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Milestone,
  NotebookPen,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sunrise,
  Target,
  Timer,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for application navigation. Drives the sidebar, mobile
 * drawer, bottom navigation, breadcrumbs, and command palette.
 *
 * Labels are English here; Layer 18 moves them behind i18n keys.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Longer text for the command palette. */
  description?: string;
  /** Build layer that turns the placeholder into a real screen. */
  plannedLayer?: number;
}

export interface NavSection {
  id: string;
  label: string;
  /** Section landing route (also the sidebar header link). */
  href: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Recovery Center — visually separated; privacy-gated in Layer 15. */
  private?: boolean;
}

export const DASHBOARD_ITEM: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  description: "Your daily overview",
  plannedLayer: 7,
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "plan",
    label: "Plan",
    href: "/plan",
    icon: Compass,
    items: [
      { label: "Life Vision", href: "/plan/vision", icon: Compass, plannedLayer: 8 },
      { label: "Five-Year Plans", href: "/plan/five-year", icon: Flag, plannedLayer: 8 },
      { label: "One-Year Plans", href: "/plan/one-year", icon: Flag, plannedLayer: 8 },
      { label: "Quarterly Plans", href: "/plan/quarterly", icon: CalendarDays, plannedLayer: 8 },
      { label: "Monthly Plans", href: "/plan/monthly", icon: CalendarDays, plannedLayer: 8 },
      { label: "Weekly Plans", href: "/plan/weekly", icon: CalendarDays, plannedLayer: 8 },
      { label: "Goals", href: "/plan/goals", icon: Target, plannedLayer: 8 },
      { label: "Projects", href: "/plan/projects", icon: FolderKanban, plannedLayer: 8 },
      { label: "Milestones", href: "/plan/milestones", icon: Milestone, plannedLayer: 8 },
      { label: "Roadmaps", href: "/plan/roadmaps", icon: Route, plannedLayer: 8 },
    ],
  },
  {
    id: "focus",
    label: "Focus",
    href: "/focus",
    icon: Timer,
    items: [
      { label: "Deep Work", href: "/focus/deep-work", icon: Zap, plannedLayer: 9 },
      { label: "Pomodoro", href: "/focus/pomodoro", icon: Timer, plannedLayer: 9 },
      {
        label: "Priority Matrix",
        href: "/focus/priority-matrix",
        icon: LayoutGrid,
        plannedLayer: 9,
      },
      { label: "Calendar", href: "/focus/calendar", icon: Calendar, plannedLayer: 9 },
      {
        label: "Time Blocking",
        href: "/focus/time-blocking",
        icon: CalendarClock,
        plannedLayer: 9,
      },
      { label: "Focus Sessions", href: "/focus/sessions", icon: Clock, plannedLayer: 9 },
    ],
  },
  {
    id: "act",
    label: "Act",
    href: "/act",
    icon: CheckSquare,
    items: [
      { label: "Tasks", href: "/act/tasks", icon: ListChecks, plannedLayer: 10 },
      { label: "Habits", href: "/act/habits", icon: Flame, plannedLayer: 10 },
      { label: "Daily Routine", href: "/act/routine", icon: Sunrise, plannedLayer: 10 },
      { label: "Execution Tracker", href: "/act/execution", icon: Activity, plannedLayer: 10 },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    href: "/grow",
    icon: Sprout,
    items: [
      { label: "Journal", href: "/grow/journal", icon: NotebookPen, plannedLayer: 11 },
      { label: "Learning", href: "/grow/learning", icon: GraduationCap, plannedLayer: 11 },
      { label: "Reading", href: "/grow/reading", icon: BookOpen, plannedLayer: 11 },
      { label: "Skills", href: "/grow/skills", icon: Dumbbell, plannedLayer: 11 },
      { label: "AI Coach", href: "/grow/ai-coach", icon: Sparkles, plannedLayer: 13 },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    items: [
      { label: "KPIs", href: "/analytics/kpis", icon: BarChart3, plannedLayer: 12 },
      { label: "Life Score", href: "/analytics/life-score", icon: Gauge, plannedLayer: 12 },
      { label: "Reports", href: "/analytics/reports", icon: NotebookPen, plannedLayer: 16 },
      { label: "Trends", href: "/analytics/trends", icon: TrendingUp, plannedLayer: 12 },
    ],
  },
  {
    id: "private",
    label: "Private",
    href: "/recovery",
    icon: ShieldCheck,
    private: true,
    items: [
      {
        label: "Recovery Center",
        href: "/recovery",
        icon: ShieldCheck,
        description: "Private, privacy-gated recovery module",
        plannedLayer: 15,
      },
    ],
  },
];

export const SYSTEM_ITEMS: NavItem[] = [
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "Reminders and updates",
    plannedLayer: 17,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Profile, language, theme, notifications",
    plannedLayer: 18,
  },
];

/** Mobile bottom navigation — the five loop entry points. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  DASHBOARD_ITEM,
  ...NAV_SECTIONS.filter((section) => !section.private && section.id !== "analytics").map(
    (section) => ({ label: section.label, href: section.href, icon: section.icon }),
  ),
];

/** Every navigable destination, flattened + de-duplicated by href (later entry wins —
 * a section's own item label beats the generic section label). */
export const ALL_NAV_ITEMS: NavItem[] = (() => {
  const collected: NavItem[] = [
    DASHBOARD_ITEM,
    ...NAV_SECTIONS.flatMap((section) => [
      {
        label: section.label,
        href: section.href,
        icon: section.icon,
        description: `${section.label} overview`,
      },
      ...section.items,
    ]),
    ...SYSTEM_ITEMS,
  ];
  const byHref = new Map<string, NavItem>();
  for (const item of collected) byHref.set(item.href, item);
  return [...byHref.values()];
})();

const LABEL_BY_HREF = new Map(ALL_NAV_ITEMS.map((item) => [item.href, item.label]));

export function navLabelForHref(href: string): string | undefined {
  return LABEL_BY_HREF.get(href);
}

/** Whether `href` is the active route for `pathname` (exact match or a parent segment). */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

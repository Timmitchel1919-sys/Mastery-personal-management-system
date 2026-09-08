/**
 * Per-module overview configuration for the six Mastery modules. Drives
 * `SectionLanding` (the module home page): the question the module answers, its
 * one dominant primary action, which submodules to surface first, and a one-line
 * purpose for each submodule.
 *
 * Everything here points at routes that already exist in `@/config/navigation`.
 * Copy is English to match the rest of the app (i18n migration is Layer 18).
 */

export interface ModuleOverviewConfig {
  /** The question a user should be able to answer within seconds of landing. */
  question: string;
  /** The single dominant call to action. `href` is an existing route. */
  primaryAction: { label: string; href: string };
  /** Submodule hrefs to show in the high-priority "Start here" row. */
  featured: string[];
  /** One-line purpose per submodule href (keys are `NavItem.href`). */
  descriptions: Record<string, string>;
}

export const MODULE_OVERVIEW: Record<string, ModuleOverviewConfig> = {
  plan: {
    question: "What should I do, and when?",
    primaryAction: { label: "Plan this week", href: "/plan/weekly" },
    featured: ["/plan/weekly", "/plan/vision", "/plan/cascade"],
    descriptions: {
      "/plan/vision": "The long-range direction everything else ladders up to.",
      "/plan/five-year": "Turn the vision into five-year outcomes.",
      "/plan/one-year": "This year's commitments.",
      "/plan/quarterly": "Your 90-day focus areas.",
      "/plan/monthly": "This month's plan.",
      "/plan/weekly": "Set this week's priorities and schedule.",
      "/plan/cascade": "Trace any record up to your vision.",
    },
  },
  focus: {
    question: "What deserves my attention right now?",
    primaryAction: { label: "Start deep work", href: "/focus/deep-work" },
    featured: ["/focus/deep-work", "/focus/priority-matrix", "/focus/calendar"],
    descriptions: {
      "/focus/deep-work": "Run a focused work session.",
      "/focus/pomodoro": "Timed intervals with short breaks.",
      "/focus/priority-matrix": "Sort tasks by urgency and importance.",
      "/focus/calendar": "See focus time against your day.",
      "/focus/time-blocking": "Reserve blocks for deliberate work.",
      "/focus/sessions": "History and stats for your focus work.",
    },
  },
  act: {
    question: "What action should I take now?",
    primaryAction: { label: "Add a task", href: "/act/tasks" },
    featured: ["/act/tasks", "/act/habits", "/act/routine"],
    descriptions: {
      "/act/tasks": "Everything due and what's next.",
      "/act/habits": "Daily disciplines and streaks.",
      "/act/routine": "Your repeatable daily sequence.",
      "/act/execution": "Planned versus completed — a rhythm check, not a score.",
    },
  },
  grow: {
    question: "How am I developing myself?",
    primaryAction: { label: "Write a journal entry", href: "/grow/journal" },
    featured: ["/grow/journal", "/grow/skills", "/grow/learning"],
    descriptions: {
      "/grow/journal": "Reflect on the day.",
      "/grow/learning": "Courses and topics in progress.",
      "/grow/reading": "Your reading list and progress.",
      "/grow/skills": "Capabilities you're deliberately building.",
      "/grow/ai-coach": "Ask for guidance grounded in your own record.",
    },
  },
  analytics: {
    question: "What do my patterns and progress tell me?",
    primaryAction: { label: "Review Life Score", href: "/analytics/life-score" },
    featured: ["/analytics/life-score", "/analytics/trends", "/analytics/kpis"],
    descriptions: {
      "/analytics/kpis": "Key measures across the three pillars.",
      "/analytics/life-score": "A transparent score built from your KPIs.",
      "/analytics/reports": "Exportable summaries of your activity.",
      "/analytics/trends": "How your metrics move over time.",
    },
  },
};

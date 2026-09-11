/**
 * Layer T — Personal Command Layer (pure core).
 *
 * A deterministic router from a short phrase to an existing MASTERY screen.
 * Every built-in command is `intent: "VIEW"` — it only navigates to a route the
 * user is already authorized to see. This module never validates, simulates,
 * approves, or executes anything; it is the safe on-ramp described in the
 * layer spec (INTENT DETECTION → ... → EXECUTION) for the one intent that
 * needs no further gate. A future intent that changes data must be added
 * behind Layer R's policy engine, not here.
 */

export type CommandIntent = "VIEW" | "SEARCH" | "CREATE" | "UPDATE" | "ANALYZE" | "SIMULATE" | "PLAN" | "EXECUTE" | "REVIEW";

export interface CommandDefinition {
  id: string;
  /** What the user might type or say — used for matching, not exact phrases only. */
  phrases: string[];
  label: string;
  description: string;
  intent: CommandIntent;
  href: string;
}

/** The 20-ish canonical commands the spec calls out, each a pure navigation to an
 * existing screen. Extend this table, not the matcher, when adding a command. */
export const COMMAND_CATALOG: CommandDefinition[] = [
  { id: "priorities", phrases: ["show my priorities", "priorities", "what matters today"], label: "Show my priorities", description: "Open the Command Center", intent: "VIEW", href: "/command" },
  { id: "attention", phrases: ["what needs attention", "attention", "what's at risk"], label: "What needs attention?", description: "Open the Command Center's attention queue", intent: "VIEW", href: "/command" },
  { id: "changed", phrases: ["what changed", "what's new", "recent changes"], label: "What changed?", description: "Open Adaptation's signal feed", intent: "VIEW", href: "/adaptation" },
  { id: "plan-day", phrases: ["plan my day", "plan today", "daily brief"], label: "Plan my day", description: "Open today's brief in Adaptation", intent: "PLAN", href: "/adaptation" },
  { id: "review-goals", phrases: ["review my goals", "review goals", "goal review"], label: "Review my goals", description: "Open Goals", intent: "REVIEW", href: "/plan/goals" },
  { id: "simulate", phrases: ["simulate this change", "simulate", "run a simulation", "what if"], label: "Simulate a change", description: "Open the Digital Twin simulator", intent: "SIMULATE", href: "/simulation" },
  { id: "start-focus", phrases: ["start a focus session", "start focus", "focus now"], label: "Start a focus session", description: "Open Focus", intent: "EXECUTE", href: "/focus" },
  { id: "weekly-performance", phrases: ["show my weekly performance", "weekly performance", "weekly review"], label: "Show my weekly performance", description: "Open the weekly review in Strategy", intent: "ANALYZE", href: "/strategy" },
  { id: "review-decisions", phrases: ["review decisions", "open decisions", "decisions"], label: "Review decisions", description: "Open Decisions", intent: "REVIEW", href: "/decisions" },
  { id: "review-risks", phrases: ["view risks", "show risks", "risk center"], label: "View risks", description: "Open Strategy's risk center", intent: "VIEW", href: "/strategy" },
  { id: "review-insights", phrases: ["review insights", "show insights"], label: "Review insights", description: "Open the Brain Hub", intent: "REVIEW", href: "/hub" },
  { id: "knowledge", phrases: ["search my knowledge", "knowledge hub", "my notes"], label: "Open Knowledge Hub", description: "Search notes, lessons, and history", intent: "SEARCH", href: "/knowledge" },
  { id: "trust-center", phrases: ["what is mastery allowed to do", "trust center", "automation permissions"], label: "Open Trust Center", description: "Autonomy level, permissions, approvals", intent: "VIEW", href: "/operations" },
  { id: "add-task", phrases: ["add a task", "new task", "create task"], label: "Add a task", description: "Open Tasks", intent: "CREATE", href: "/act/tasks" },
];

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[?!.]+$/, "");
}

export interface CommandMatch {
  command: CommandDefinition;
  /** Higher is a better match. Exact phrase > startsWith > contains > word overlap. */
  score: number;
}

/** Deterministic matching — exact phrase, then prefix, then substring, then a
 * simple word-overlap fallback. No AI model is involved. */
export function matchCommand(input: string, catalog: CommandDefinition[] = COMMAND_CATALOG): CommandMatch[] {
  const query = normalize(input);
  if (!query) return [];

  const results: CommandMatch[] = [];
  for (const command of catalog) {
    let best = 0;
    for (const phrase of command.phrases) {
      const p = normalize(phrase);
      if (p === query) best = Math.max(best, 100);
      else if (p.startsWith(query) || query.startsWith(p)) best = Math.max(best, 70);
      else if (p.includes(query) || query.includes(p)) best = Math.max(best, 50);
      else {
        const queryWords = new Set(query.split(/\s+/).filter((w) => w.length > 2));
        const phraseWords = p.split(/\s+/);
        const overlap = phraseWords.filter((w) => queryWords.has(w)).length;
        if (overlap > 0) best = Math.max(best, overlap * 15);
      }
    }
    if (best > 0) results.push({ command, score: best });
  }

  return results.sort((a, b) => b.score - a.score);
}

/** The single best match, or null when nothing scores meaningfully. */
export function resolveCommand(input: string, catalog: CommandDefinition[] = COMMAND_CATALOG): CommandDefinition | null {
  const [top] = matchCommand(input, catalog);
  return top && top.score >= 15 ? top.command : null;
}

/** Every built-in command must resolve to an internal MASTERY route — never an
 * external URL a phrase could be crafted to redirect to. A structural safety
 * guarantee this function makes checkable, not merely asserted. */
export function isNavigationSafe(command: CommandDefinition): boolean {
  return command.href.startsWith("/") && !command.href.startsWith("//");
}

import type { DecisionRecord } from "@/features/decisions/schema";
import type { Goal } from "@/features/goals/schema";
import type { JournalEntry } from "@/features/journal/schema";
import type { Plan } from "@/features/plans/schema";
import type { Task } from "@/features/tasks/schema";

/**
 * Layer P — Knowledge & Personal Context Engine (pure core).
 *
 * A normalised, reference-based index over the user's own MASTERY history plus
 * their explicit notes. It answers one question — "what information is relevant to
 * what I am doing right now?" — deterministically first. It stores references,
 * not copies; it distinguishes explicit from inferred context; it never infers
 * anything sensitive, and it says "No relevant history found" rather than
 * guessing. All of it is user-scoped by construction (it only ever sees data the
 * caller already loaded for the signed-in user).
 */

export type ContextType =
  | "GOAL"
  | "PLAN"
  | "TASK"
  | "PROJECT"
  | "DECISION"
  | "NOTE"
  | "REFLECTION"
  | "OUTCOME"
  | "INSIGHT"
  | "LEARNING"
  | "STRATEGY"
  | "REFERENCE";

export type ContextRelevance = "direct" | "high" | "medium" | "low" | "irrelevant";
export type ContextConfidence = "explicit" | "verified" | "observed" | "inferred";
export type ContextWindow = "current" | "today" | "recent" | "historical" | "strategic";
export type ContextLifecycle = "active" | "archived" | "expired" | "deleted";

export interface ContextRefs {
  goalId?: string;
  planId?: string;
  taskId?: string;
  projectId?: string;
  milestoneId?: string;
  decisionId?: string;
}

export interface ContextItem {
  id: string;
  type: ContextType;
  /** The primary-domain record this points at — never a copy of it. */
  sourceId: string;
  /** Route to open the underlying record. */
  href: string;
  title: string;
  /** A short, non-sensitive excerpt for display and AI assembly. */
  snippet: string;
  tags: string[];
  refs: ContextRefs;
  /** ISO date of the underlying record (its own date, not "now"). */
  date: string;
  confidence: ContextConfidence;
  lifecycle: ContextLifecycle;
}

export interface ContextRelationship {
  fromId: string;
  toId: string;
  kind: "belongs-to" | "affects" | "reflects-on" | "linked";
}

export interface ContextConflict {
  id: string;
  sourceIds: string[];
  field: string;
  statement: string;
  values: string[];
}

export interface ExplicitContextLink {
  type: ContextType;
  sourceId: string;
}

export interface ExplicitContextNote {
  id: string;
  title: string;
  body: string;
  tags: string[];
  links: ExplicitContextLink[];
  /** An optional constraint date the user recorded, e.g. "deadline: 2026-07-01". */
  constraintDate?: string;
  status: "active" | "archived" | "irrelevant";
  createdAt: string;
  updatedAt: string;
}

export interface ContextSources {
  goals: Goal[];
  plans: Plan[];
  tasks: Task[];
  decisions: DecisionRecord[];
  journal: JournalEntry[];
  explicitNotes: ExplicitContextNote[];
  /** sourceIds the user has marked irrelevant — excluded from query results. */
  irrelevantSourceIds?: string[];
}

export interface ContextQuery {
  now?: string;
  module?: "goals" | "plan" | "focus" | "act" | "grow" | "analytics" | "strategy" | "dashboard";
  activeGoalId?: string;
  activePlanId?: string;
  activeTaskId?: string;
  tags?: string[];
  /** Free text — deterministic substring match over title / snippet / tags. */
  text?: string;
  windows?: ContextWindow[];
  limit?: number;
}

export interface ContextQueryResult {
  item: ContextItem;
  relevance: ContextRelevance;
  window: ContextWindow;
  /** User-facing "why am I seeing this?" */
  reason: string;
}

export interface AiContextBundle {
  items: Array<{ type: ContextType; title: string; snippet: string; date: string; href: string }>;
  omittedCount: number;
  note: string;
}

const DAY_MS = 86_400_000;

export const RELEVANCE_RANK: Record<ContextRelevance, number> = {
  direct: 0,
  high: 1,
  medium: 2,
  low: 3,
  irrelevant: 4,
};

export const CONFIDENCE_RANK: Record<ContextConfidence, number> = {
  explicit: 0,
  verified: 1,
  observed: 2,
  inferred: 3,
};

const MODULE_TYPES: Record<NonNullable<ContextQuery["module"]>, ContextType[]> = {
  goals: ["GOAL", "PLAN", "DECISION", "LEARNING"],
  plan: ["PLAN", "GOAL", "TASK", "DECISION"],
  focus: ["TASK", "PLAN", "OUTCOME"],
  act: ["TASK", "GOAL", "OUTCOME"],
  grow: ["REFLECTION", "LEARNING", "INSIGHT", "NOTE"],
  analytics: ["OUTCOME", "INSIGHT", "LEARNING"],
  strategy: ["GOAL", "PLAN", "DECISION", "LEARNING", "REFLECTION"],
  dashboard: ["TASK", "GOAL", "PLAN", "DECISION"],
};

function daysBetween(fromIso: string, toIso: string): number {
  return Math.abs(Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS));
}

function truncate(text: string, max = 220): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function dateOf(record: { updatedAt?: string; entryDate?: string; targetDate?: string | null }): string {
  return record.entryDate ?? record.updatedAt ?? new Date().toISOString();
}

/** Build the reference index. References only — snippets are short excerpts, never
 * a full copy of the underlying record. */
export function buildContextIndex(sources: ContextSources): ContextItem[] {
  const irrelevant = new Set(sources.irrelevantSourceIds ?? []);
  const items: ContextItem[] = [];

  for (const goal of sources.goals) {
    items.push({
      id: `ctx:goal:${goal.id}`,
      type: "GOAL",
      sourceId: goal.id,
      href: "/plan/goals",
      title: goal.title,
      snippet: truncate(goal.description || `${goal.goalStatus}, ${goal.progress}% complete`),
      tags: goal.pillarIds,
      refs: { goalId: goal.id, planId: goal.parentPlanId ?? undefined },
      date: dateOf(goal),
      confidence: "verified",
      lifecycle: goal.goalStatus === "achieved" || goal.goalStatus === "dropped" ? "archived" : "active",
    });
  }

  for (const plan of sources.plans) {
    items.push({
      id: `ctx:plan:${plan.id}`,
      type: "PLAN",
      sourceId: plan.id,
      href: "/plan",
      title: plan.title,
      snippet: truncate(plan.objective || `${plan.horizon} plan, ${plan.progress}% complete`),
      tags: plan.pillarIds,
      refs: { planId: plan.id },
      date: dateOf(plan),
      confidence: "verified",
      lifecycle:
        plan.planStatus === "complete" || plan.planStatus === "abandoned" ? "archived" : "active",
    });
  }

  for (const task of sources.tasks) {
    items.push({
      id: `ctx:task:${task.id}`,
      type: "TASK",
      sourceId: task.id,
      href: "/act/tasks",
      title: task.title,
      snippet: truncate(task.description || `${task.taskStatus}, ${task.priority} priority`),
      tags: task.tags ?? [],
      refs: {
        taskId: task.id,
        goalId: task.goalId ?? undefined,
        projectId: task.projectId ?? undefined,
        milestoneId: task.milestoneId ?? undefined,
      },
      date: dateOf(task),
      confidence: "verified",
      lifecycle:
        task.taskStatus === "done" || task.taskStatus === "cancelled" ? "archived" : "active",
    });
  }

  for (const decision of sources.decisions) {
    items.push({
      id: `ctx:decision:${decision.id}`,
      type: "DECISION",
      sourceId: decision.id,
      href: "/decisions",
      title: decision.title,
      snippet: truncate(decision.context || decision.description),
      tags: [decision.domain],
      refs: {
        decisionId: decision.id,
        goalId: decision.relatedGoals[0],
        planId: decision.relatedPlans[0],
      },
      date: decision.updatedAt,
      confidence: "verified",
      lifecycle:
        decision.status === "DECIDED" || decision.status === "COMPLETED" || decision.status === "CANCELLED"
          ? "archived"
          : "active",
    });
  }

  for (const entry of sources.journal) {
    const isLesson = entry.entryType === "lessons-learned";
    items.push({
      id: `ctx:journal:${entry.id}`,
      type: isLesson ? "LEARNING" : "REFLECTION",
      sourceId: entry.id,
      href: "/grow/journal",
      title: entry.title || (isLesson ? "Lesson" : "Reflection"),
      snippet: truncate(entry.content),
      tags: entry.tags,
      refs: { goalId: entry.goalId ?? undefined },
      date: entry.entryDate,
      confidence: "verified",
      lifecycle: "active",
    });
  }

  for (const note of sources.explicitNotes) {
    if (note.status === "archived") continue;
    items.push({
      id: `ctx:note:${note.id}`,
      type: "NOTE",
      sourceId: note.id,
      href: "/knowledge",
      title: note.title,
      snippet: truncate(note.body),
      tags: note.tags,
      refs: {
        goalId: note.links.find((link) => link.type === "GOAL")?.sourceId,
        planId: note.links.find((link) => link.type === "PLAN")?.sourceId,
        taskId: note.links.find((link) => link.type === "TASK")?.sourceId,
        projectId: note.links.find((link) => link.type === "PROJECT")?.sourceId,
        decisionId: note.links.find((link) => link.type === "DECISION")?.sourceId,
      },
      date: note.updatedAt,
      // Explicit user context — highest confidence, unless the user parked it.
      confidence: "explicit",
      lifecycle: note.status === "irrelevant" ? "expired" : "active",
    });
  }

  return items.filter((item) => !irrelevant.has(item.sourceId));
}

/** Derive relationships from the references already on each item. */
export function deriveRelationships(items: ContextItem[]): ContextRelationship[] {
  const byRef = {
    goal: new Map<string, ContextItem>(),
    plan: new Map<string, ContextItem>(),
    task: new Map<string, ContextItem>(),
  };
  for (const item of items) {
    if (item.type === "GOAL") byRef.goal.set(item.sourceId, item);
    if (item.type === "PLAN") byRef.plan.set(item.sourceId, item);
    if (item.type === "TASK") byRef.task.set(item.sourceId, item);
  }

  const relationships: ContextRelationship[] = [];
  const add = (fromId: string, to: ContextItem | undefined, kind: ContextRelationship["kind"]) => {
    if (to) relationships.push({ fromId, toId: to.id, kind });
  };

  for (const item of items) {
    if (item.type === "GOAL" && item.refs.planId) {
      add(item.id, byRef.plan.get(item.refs.planId), "belongs-to");
    }
    if (item.type === "TASK" && item.refs.goalId) {
      add(item.id, byRef.goal.get(item.refs.goalId), "belongs-to");
    }
    if (item.type === "DECISION") {
      add(item.id, item.refs.goalId ? byRef.goal.get(item.refs.goalId) : undefined, "affects");
      add(item.id, item.refs.planId ? byRef.plan.get(item.refs.planId) : undefined, "affects");
    }
    if ((item.type === "REFLECTION" || item.type === "LEARNING") && item.refs.goalId) {
      add(item.id, byRef.goal.get(item.refs.goalId), "reflects-on");
    }
    if (item.type === "NOTE") {
      add(item.id, item.refs.goalId ? byRef.goal.get(item.refs.goalId) : undefined, "linked");
      add(item.id, item.refs.planId ? byRef.plan.get(item.refs.planId) : undefined, "linked");
      add(item.id, item.refs.taskId ? byRef.task.get(item.refs.taskId) : undefined, "linked");
    }
  }
  return relationships;
}

export function classifyWindow(item: ContextItem, now: string): ContextWindow {
  if (item.type === "STRATEGY" || (item.type === "GOAL" && item.lifecycle === "active")) {
    if (item.type === "GOAL") return "strategic";
  }
  const age = daysBetween(item.date, now);
  if (age <= 1) return "current";
  if (age <= 3) return "today";
  if (age <= 30) return "recent";
  return "historical";
}

function textMatches(item: ContextItem, text: string): boolean {
  const needle = text.trim().toLowerCase();
  if (!needle) return true;
  return (
    item.title.toLowerCase().includes(needle) ||
    item.snippet.toLowerCase().includes(needle) ||
    item.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
}

/** Deterministic relevance. Direct relationships and explicit user context win;
 * AI is never required to answer "what is relevant". */
export function queryContext(
  index: ContextItem[],
  relationships: ContextRelationship[],
  query: ContextQuery,
): ContextQueryResult[] {
  const now = query.now ?? new Date().toISOString();
  const moduleTypes = query.module ? new Set(MODULE_TYPES[query.module]) : null;

  const relatedToActive = new Set<string>();
  if (query.activeGoalId || query.activePlanId || query.activeTaskId) {
    for (const item of index) {
      if (query.activeGoalId && item.refs.goalId === query.activeGoalId) relatedToActive.add(item.id);
      if (query.activePlanId && item.refs.planId === query.activePlanId) relatedToActive.add(item.id);
      if (query.activeTaskId && item.refs.taskId === query.activeTaskId) relatedToActive.add(item.id);
    }
    // one relationship hop out from the active anchors
    for (const rel of relationships) {
      if (relatedToActive.has(rel.fromId)) relatedToActive.add(rel.toId);
      if (relatedToActive.has(rel.toId)) relatedToActive.add(rel.fromId);
    }
  }

  const results: ContextQueryResult[] = [];
  for (const item of index) {
    if (item.lifecycle === "deleted" || item.lifecycle === "expired") continue;
    if (query.text && !textMatches(item, query.text)) continue;

    const window = classifyWindow(item, now);
    if (query.windows && !query.windows.includes(window)) continue;

    const isActiveSource =
      item.sourceId === query.activeGoalId ||
      item.sourceId === query.activePlanId ||
      item.sourceId === query.activeTaskId;
    const tagMatch = (query.tags ?? []).some((tag) => item.tags.includes(tag));
    const moduleMatch = moduleTypes ? moduleTypes.has(item.type) : false;
    const ageDays = daysBetween(item.date, now);

    let relevance: ContextRelevance;
    let reason: string;

    if (isActiveSource) {
      relevance = "direct";
      reason = "This is the record you are looking at.";
    } else if (relatedToActive.has(item.id)) {
      relevance = "direct";
      reason = "Directly linked to what you are working on.";
    } else if (item.confidence === "explicit" && (moduleMatch || tagMatch || !query.module)) {
      relevance = "high";
      reason = "You added this as important context.";
    } else if (moduleMatch && ageDays <= 30) {
      relevance = "high";
      reason = `Recent ${item.type.toLowerCase()} in this area (${ageDays}d ago).`;
    } else if (tagMatch) {
      relevance = "medium";
      reason = "Shares a tag with your current focus.";
    } else if (moduleMatch) {
      relevance = "medium";
      reason = `Older ${item.type.toLowerCase()} in this area.`;
    } else if (query.text) {
      relevance = "low";
      reason = "Text match only.";
    } else {
      continue; // irrelevant — do not surface
    }

    results.push({ item, relevance, window, reason });
  }

  results.sort((a, b) => {
    const rel = RELEVANCE_RANK[a.relevance] - RELEVANCE_RANK[b.relevance];
    if (rel !== 0) return rel;
    const conf = CONFIDENCE_RANK[a.item.confidence] - CONFIDENCE_RANK[b.item.confidence];
    if (conf !== 0) return conf;
    return Date.parse(b.item.date) - Date.parse(a.item.date);
  });

  return typeof query.limit === "number" ? results.slice(0, query.limit) : results;
}

/** Conflicting information about the same underlying record or an explicit
 * constraint that disagrees with the system of record. Never resolved
 * automatically — surfaced for the user to settle. */
export function detectContextConflicts(
  sources: ContextSources,
  index: ContextItem[],
): ContextConflict[] {
  const conflicts: ContextConflict[] = [];
  const goalById = new Map(sources.goals.map((goal) => [goal.id, goal]));

  for (const note of sources.explicitNotes) {
    if (note.status !== "active" || !note.constraintDate) continue;
    const goalLink = note.links.find((link) => link.type === "GOAL");
    if (!goalLink) continue;
    const goal = goalById.get(goalLink.sourceId);
    if (!goal || !goal.targetDate) continue;
    if (goal.targetDate !== note.constraintDate) {
      conflicts.push({
        id: `conflict:note:${note.id}`,
        sourceIds: [note.id, goal.id],
        field: "date",
        statement: `Your note "${note.title}" says ${note.constraintDate}, but goal "${goal.title}" targets ${goal.targetDate}.`,
        values: [note.constraintDate, goal.targetDate],
      });
    }
  }

  // Duplicate titles across active records of the same type can indicate a fork.
  const byTypeTitle = new Map<string, ContextItem[]>();
  for (const item of index) {
    if (item.lifecycle !== "active") continue;
    const key = `${item.type}::${item.title.trim().toLowerCase()}`;
    byTypeTitle.set(key, [...(byTypeTitle.get(key) ?? []), item]);
  }
  for (const [key, group] of byTypeTitle) {
    if (group.length < 2) continue;
    conflicts.push({
      id: `conflict:dup:${key}`,
      sourceIds: group.map((item) => item.sourceId),
      field: "title",
      statement: `${group.length} active ${group[0]?.type.toLowerCase()} records share the title "${group[0]?.title}".`,
      values: group.map((item) => item.date),
    });
  }

  return conflicts;
}

export function explainRelevance(result: ContextQueryResult): string {
  const dateLabel = result.item.date.slice(0, 10);
  return `${result.reason} (${result.item.type.toLowerCase()}, ${dateLabel}, ${result.window})`;
}

export interface AiContextRequest {
  intent: string;
  module?: ContextQuery["module"];
  activeGoalId?: string;
  activePlanId?: string;
  activeTaskId?: string;
  tags?: string[];
  now?: string;
}

export interface AiContextOptions {
  maxItems?: number;
  maxChars?: number;
}

/** Assemble the minimum necessary context for an AI request. Never the whole
 * history; only what the deterministic query ranks as relevant, capped. When
 * nothing is relevant it says so — the caller must not fabricate history. */
export function assembleAiContext(
  index: ContextItem[],
  relationships: ContextRelationship[],
  request: AiContextRequest,
  options: AiContextOptions = {},
): AiContextBundle {
  const maxItems = options.maxItems ?? 8;
  const maxChars = options.maxChars ?? 2400;

  const ranked = queryContext(index, relationships, {
    now: request.now,
    module: request.module,
    activeGoalId: request.activeGoalId,
    activePlanId: request.activePlanId,
    activeTaskId: request.activeTaskId,
    tags: request.tags,
  }).filter((result) => result.relevance === "direct" || result.relevance === "high");

  if (ranked.length === 0) {
    return { items: [], omittedCount: 0, note: "No relevant history found." };
  }

  const picked: AiContextBundle["items"] = [];
  let chars = 0;
  for (const result of ranked) {
    if (picked.length >= maxItems) break;
    const entry = {
      type: result.item.type,
      title: result.item.title,
      snippet: result.item.snippet,
      date: result.item.date,
      href: result.item.href,
    };
    const cost = entry.title.length + entry.snippet.length;
    if (chars + cost > maxChars && picked.length > 0) break;
    picked.push(entry);
    chars += cost;
  }

  return {
    items: picked,
    omittedCount: Math.max(0, ranked.length - picked.length),
    note:
      picked.length === ranked.length
        ? `${picked.length} relevant item(s), all included.`
        : `${picked.length} of ${ranked.length} relevant item(s) included (minimum necessary).`,
  };
}

export const CONTEXT_RELEVANCE_LABEL: Record<ContextRelevance, string> = {
  direct: "Direct",
  high: "High",
  medium: "Medium",
  low: "Low",
  irrelevant: "Not relevant",
};

export const CONTEXT_CONFIDENCE_LABEL: Record<ContextConfidence, string> = {
  explicit: "You added this",
  verified: "From your records",
  observed: "Observed",
  inferred: "Inferred",
};

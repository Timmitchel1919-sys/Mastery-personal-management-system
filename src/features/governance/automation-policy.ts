import { ACTION_CATALOG, type OpsActionType, type TriggerType } from "@/features/autonomy";

/**
 * Layer V — natural-language automation → controlled policy.
 *
 * Deterministic phrase recognition only (no LLM call from the client, per
 * CLAUDE.md §5 and the Layer T command router this mirrors). A recognized
 * phrase becomes a `PolicyDraft` — INTENT → POLICY → CONDITIONS → ACTION —
 * that must be previewed in plain language and explicitly activated before it
 * exists as a real `AutomationRule`. Nothing here executes anything.
 */

export interface PolicyDraft {
  id: string;
  sourcePhrase: string;
  name: string;
  trigger: TriggerType;
  triggerLabel: string;
  actionType: OpsActionType;
  conditions: string[];
  dataUsed: string[];
  approvalRequired: boolean;
  version: number;
  createdAt: string;
}

interface PhrasePattern {
  test: RegExp;
  build: (match: RegExpMatchArray, phrase: string, nowIso: string) => Omit<PolicyDraft, "id" | "version" | "createdAt" | "sourcePhrase">;
}

const PATTERNS: PhrasePattern[] = [
  {
    test: /remind me to (review|check) my goals/i,
    build: () => ({
      name: "Weekday goal reminder",
      trigger: "TIME_MORNING",
      triggerLabel: "every weekday morning",
      actionType: "CREATE_INTERNAL_REMINDER",
      conditions: ["Runs only on weekdays.", "Only prepares a reminder — it does not modify your goals."],
      dataUsed: ["Your active goals"],
      approvalRequired: true,
    }),
  },
  {
    test: /organi[sz]e my low-priority tasks/i,
    build: () => ({
      name: "Low-priority task organizer",
      trigger: "TASK_COMPLETED",
      triggerLabel: "when a task is completed",
      actionType: "CLASSIFY_INBOX",
      conditions: ["Only touches tasks marked low priority.", "Never reprioritizes or deletes a task."],
      dataUsed: ["Your open tasks"],
      approvalRequired: false,
    }),
  },
  {
    test: /keep (my )?friday afternoons? (available|free) for deep work/i,
    build: () => ({
      name: "Protect Friday deep work",
      trigger: "WEEKLY_REVIEW",
      triggerLabel: "during the weekly review",
      actionType: "PREPARE_WEEKLY_REVIEW",
      conditions: ["Flags conflicts on Friday afternoon — does not move or cancel anything itself."],
      dataUsed: ["Your calendar and focus blocks"],
      approvalRequired: true,
    }),
  },
];

/** Recognize one of the supported automation phrases. Returns null for
 * anything unrecognized — this never falls back to an LLM interpretation that
 * could bypass the fixed action catalog. */
export function parseAutomationRequest(phrase: string, nowIso: string = new Date().toISOString()): PolicyDraft | null {
  for (const pattern of PATTERNS) {
    const match = phrase.match(pattern.test);
    if (match) {
      const built = pattern.build(match, phrase, nowIso);
      return {
        id: `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        sourcePhrase: phrase,
        version: 1,
        createdAt: nowIso,
        ...built,
      };
    }
  }
  return null;
}

/** "Every weekday at 08:00, analyze today's schedule and recommend changes. No
 * changes will be made automatically." — the mandatory human-readable preview
 * before a draft can be activated. */
export function describePolicyPreview(draft: PolicyDraft): string {
  const action = ACTION_CATALOG[draft.actionType].label;
  const approval = draft.approvalRequired
    ? "Every occurrence will wait for your approval before anything happens."
    : "This is a low-risk, internal action only — no other data is touched automatically.";
  return `${draft.triggerLabel[0]!.toUpperCase()}${draft.triggerLabel.slice(1)}, MASTERY will ${action.toLowerCase()}. ${approval}`;
}

/** Bump the version rather than mutating the existing draft — history of what
 * a policy used to say is never silently lost. */
export function reviseDraft(draft: PolicyDraft, patch: Partial<Pick<PolicyDraft, "name" | "conditions" | "approvalRequired">>, nowIso: string): PolicyDraft {
  return { ...draft, ...patch, version: draft.version + 1, createdAt: nowIso };
}

export interface PolicyTestResult {
  wouldFire: boolean;
  explanation: string;
}

/** TEST POLICY — evaluate against current data without creating or executing
 * anything. */
export function testPolicyDraft(draft: PolicyDraft, currentTriggerFired: boolean): PolicyTestResult {
  return {
    wouldFire: currentTriggerFired,
    explanation: currentTriggerFired
      ? `If this were active, it would have fired just now (${draft.triggerLabel}) and prepared "${ACTION_CATALOG[draft.actionType].label}" for your review.`
      : `If this were active, it would not fire right now — its trigger (${draft.triggerLabel}) has not occurred.`,
  };
}

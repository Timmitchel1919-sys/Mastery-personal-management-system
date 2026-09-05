import type { Firestore } from "firebase-admin/firestore";
import type { ContextRef } from "../ai/shared/contracts";

/**
 * Isolated context retrieval for the Recovery Coach (Layer 15E), per
 * `docs/RECOVERY_PRIVACY.md` §3/§5 and `docs/AI_ARCHITECTURE.md` §7. Reads **only** the
 * caller's own recovery collections — the recovery goal and its check-ins, setbacks, and
 * coping toolkit. It never touches `goals`, `journalEntries`, `tasks`, or anything the
 * general coach sees, and the general `buildContext` never touches these. Reads defensively
 * (loose field access) — `functions/` and `src/` are separate packages.
 */

export interface RecoveryCoachContext {
  text: string;
  refs: ContextRef[];
  faithBased: boolean;
  goalBehavior: string | null;
}

function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function strList(value: unknown, max = 10): string[] {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        .slice(0, max)
    : [];
}

export const EMPTY_RECOVERY_CONTEXT: RecoveryCoachContext = {
  text: "",
  refs: [],
  faithBased: false,
  goalBehavior: null,
};

export async function buildRecoveryCoachContext(
  db: Firestore,
  uid: string,
  goalId: string,
): Promise<RecoveryCoachContext | null> {
  const goalSnap = await db.doc(`users/${uid}/recoveryGoals/${goalId}`).get();
  if (!goalSnap.exists) return null;

  const goal = asRecord(goalSnap.data());
  const behavior = str(goal.behavior, goalId);
  const faithBased = goal.faithBasedEncouragement === true;
  const refs: ContextRef[] = [{ collection: "recoveryGoals", id: goalId, label: behavior }];
  const parts: string[] = [];

  const goalLines = [
    `Behavior the user is working on: ${behavior}`,
    goal.motivation ? `Their motivation: ${str(goal.motivation)}` : null,
    `Current self-reported status: ${str(goal.recoveryStatus, "active")}`,
  ];
  const triggers = strList(goal.triggers);
  if (triggers.length > 0) goalLines.push(`Known triggers: ${triggers.join("; ")}`);
  const warningSigns = strList(goal.warningSigns);
  if (warningSigns.length > 0) goalLines.push(`Early warning signs: ${warningSigns.join("; ")}`);
  const strategies = strList(goal.copingStrategies);
  if (strategies.length > 0)
    goalLines.push(`Coping strategies on the goal: ${strategies.join("; ")}`);
  parts.push(goalLines.filter((line): line is string => Boolean(line)).join("\n"));

  const checkInsSnap = await db
    .collection(`users/${uid}/recoveryGoals/${goalId}/checkIns`)
    .orderBy("date", "desc")
    .limit(7)
    .get();
  const checkIns = checkInsSnap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((data) => data.status !== "archived");
  if (checkIns.length > 0) {
    parts.push(
      `Recent check-ins (most recent first):\n${checkIns
        .map((data) => {
          const halt = asRecord(data.halt);
          const active = ["hungry", "angry", "lonely", "tired"].filter((key) => halt[key] === true);
          return `- ${str(data.date, "?")}: ${
            data.stayedOnTrack === false ? "hard day" : "stayed on track"
          }, urge ${String(data.urgeIntensity ?? "?")}/10${
            active.length > 0 ? `, HALT: ${active.join(", ")}` : ""
          }`;
        })
        .join("\n")}`,
    );
  }

  const relapsesSnap = await db
    .collection(`users/${uid}/recoveryGoals/${goalId}/relapses`)
    .orderBy("date", "desc")
    .limit(3)
    .get();
  const relapses = relapsesSnap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((data) => data.status !== "archived");
  if (relapses.length > 0) {
    parts.push(
      `Recent setbacks:\n${relapses
        .map(
          (data) =>
            `- ${str(data.date, "?")}${data.restartPlan ? `, restart plan: ${str(data.restartPlan)}` : ""}`,
        )
        .join("\n")}`,
    );
  }

  const copingSnap = await db
    .collection(`users/${uid}/recoveryGoals/${goalId}/copingActions`)
    .limit(30)
    .get();
  const copingTitles = copingSnap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((data) => data.status !== "archived")
    .map((data) => str(data.title))
    .filter(Boolean);
  if (copingTitles.length > 0) {
    parts.push(`Coping toolkit the user has saved: ${copingTitles.join("; ")}`);
  }

  return { text: parts.join("\n\n"), refs, faithBased, goalBehavior: behavior };
}

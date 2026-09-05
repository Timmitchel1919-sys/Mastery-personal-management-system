import type { Firestore } from "firebase-admin/firestore";

/**
 * Builds the **scoped projection** an accountability partner is allowed to see (Layer 15F),
 * per `docs/RECOVERY_PRIVACY.md` §6. Reads only the shared goal and its check-ins /
 * setbacks, and returns nothing but the fields the grant's scope permits. It never returns
 * reflections, HALT detail, triggers, setback narratives, coping actions, or coach
 * sessions — those are on the "never exposed to a partner" list.
 */

export type AccountabilityScope =
  | "streak-only"
  | "status-only"
  | "check-in-completed"
  | "selected-summary"
  | "custom-limited-access";

export type AccountabilityCustomField =
  "recoveryStatus" | "currentStreak" | "daysOnTrack" | "checkedInToday" | "lastCheckInDate";

export interface AccountabilityProjection {
  scope: AccountabilityScope;
  partnerLabel: string;
  goalBehavior: string;
  recoveryStatus: string | null;
  currentStreak: number | null;
  daysOnTrack: number | null;
  checkedInToday: boolean | null;
  lastCheckInDate: string | null;
  setbackCount: number | null;
  generatedAt: string;
}

interface GrantLike {
  goalId: string;
  scope: AccountabilityScope;
  partnerLabel?: string;
  customFields?: string[];
  includeSetbackCount?: boolean;
}

function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

/** Consecutive most-recent days with `stayedOnTrack`, over check-ins sorted date-desc. */
function currentStreakOf(sortedDesc: { stayedOnTrack: boolean }[]): number {
  let streak = 0;
  for (const entry of sortedDesc) {
    if (!entry.stayedOnTrack) break;
    streak += 1;
  }
  return streak;
}

export async function buildAccountabilityProjection(
  db: Firestore,
  ownerUid: string,
  grant: GrantLike,
  now: Date,
): Promise<AccountabilityProjection | null> {
  const goalSnap = await db.doc(`users/${ownerUid}/recoveryGoals/${grant.goalId}`).get();
  if (!goalSnap.exists) return null;
  const goal = asRecord(goalSnap.data());

  const checkInsSnap = await db
    .collection(`users/${ownerUid}/recoveryGoals/${grant.goalId}/checkIns`)
    .orderBy("date", "desc")
    .limit(120)
    .get();
  const checkIns = checkInsSnap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((data) => data.status !== "archived")
    .map((data) => ({
      date: typeof data.date === "string" ? data.date : "",
      stayedOnTrack: data.stayedOnTrack !== false,
    }))
    .filter((entry) => entry.date.length > 0);

  const today = now.toISOString().slice(0, 10);
  const lastCheckInDate = checkIns[0]?.date ?? null;
  const full = {
    recoveryStatus: typeof goal.recoveryStatus === "string" ? goal.recoveryStatus : "active",
    currentStreak: currentStreakOf(checkIns),
    daysOnTrack: checkIns.filter((entry) => entry.stayedOnTrack).length,
    checkedInToday: lastCheckInDate === today,
    lastCheckInDate,
  };

  const base: AccountabilityProjection = {
    scope: grant.scope,
    partnerLabel: grant.partnerLabel ?? "",
    goalBehavior: typeof goal.behavior === "string" ? goal.behavior : grant.goalId,
    recoveryStatus: null,
    currentStreak: null,
    daysOnTrack: null,
    checkedInToday: null,
    lastCheckInDate: null,
    setbackCount: null,
    generatedAt: now.toISOString(),
  };

  switch (grant.scope) {
    case "streak-only":
      base.currentStreak = full.currentStreak;
      break;
    case "status-only":
      base.recoveryStatus = full.recoveryStatus;
      break;
    case "check-in-completed":
      base.checkedInToday = full.checkedInToday;
      base.lastCheckInDate = full.lastCheckInDate;
      break;
    case "selected-summary":
      base.recoveryStatus = full.recoveryStatus;
      base.currentStreak = full.currentStreak;
      base.daysOnTrack = full.daysOnTrack;
      base.lastCheckInDate = full.lastCheckInDate;
      break;
    case "custom-limited-access": {
      const fields = new Set(grant.customFields ?? []);
      if (fields.has("recoveryStatus")) base.recoveryStatus = full.recoveryStatus;
      if (fields.has("currentStreak")) base.currentStreak = full.currentStreak;
      if (fields.has("daysOnTrack")) base.daysOnTrack = full.daysOnTrack;
      if (fields.has("checkedInToday")) base.checkedInToday = full.checkedInToday;
      if (fields.has("lastCheckInDate")) base.lastCheckInDate = full.lastCheckInDate;
      break;
    }
  }

  if (
    grant.includeSetbackCount === true &&
    (grant.scope === "selected-summary" || grant.scope === "custom-limited-access")
  ) {
    const relapsesSnap = await db
      .collection(`users/${ownerUid}/recoveryGoals/${grant.goalId}/relapses`)
      .limit(200)
      .get();
    base.setbackCount = relapsesSnap.docs
      .map((doc) => asRecord(doc.data()))
      .filter((data) => data.status !== "archived").length;
  }

  return base;
}

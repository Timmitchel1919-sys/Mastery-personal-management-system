import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "../../shared/errors";

/**
 * Per-user cost controls, per `docs/AI_ARCHITECTURE.md` §5. Counters are two small
 * rollup documents (`aiUsageDaily/{date}`, `aiUsageMonthly/{month}`) read-then-written —
 * not an atomic `FieldValue.increment` — trading a rare lost update under concurrent
 * requests from the same user for logic simple enough to unit-test without a live
 * Firestore. See `docs/BUILD_PROGRESS.md` Layer 13 known limitations.
 */

export const MAX_REQUESTS_PER_DAY = 50;
export const MAX_TOKENS_PER_DAY = 200_000;
export const MAX_TOKENS_PER_MONTH = 2_000_000;

export interface UsageCounters {
  requestCount: number;
  totalTokens: number;
}

export interface QuotaCheck {
  ok: boolean;
  reason?: string;
}

/** Pure threshold check — the actual quota decision, independent of how counters are read. */
export function checkQuota(
  day: UsageCounters | undefined,
  month: UsageCounters | undefined,
): QuotaCheck {
  if ((day?.requestCount ?? 0) >= MAX_REQUESTS_PER_DAY) {
    return { ok: false, reason: "You've reached today's AI request limit. Try again tomorrow." };
  }
  if ((day?.totalTokens ?? 0) >= MAX_TOKENS_PER_DAY) {
    return { ok: false, reason: "You've reached today's AI token limit. Try again tomorrow." };
  }
  if ((month?.totalTokens ?? 0) >= MAX_TOKENS_PER_MONTH) {
    return { ok: false, reason: "You've reached this month's AI usage limit." };
  }
  return { ok: true };
}

function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function monthKey(now: Date): string {
  return now.toISOString().slice(0, 7);
}

export async function assertWithinQuota(db: Firestore, uid: string, now: Date): Promise<void> {
  const [daySnap, monthSnap] = await Promise.all([
    db.doc(`users/${uid}/aiUsageDaily/${todayKey(now)}`).get(),
    db.doc(`users/${uid}/aiUsageMonthly/${monthKey(now)}`).get(),
  ]);

  const result = checkQuota(
    daySnap.data() as UsageCounters | undefined,
    monthSnap.data() as UsageCounters | undefined,
  );
  if (!result.ok) {
    throw new HttpsError("resource-exhausted", result.reason ?? "AI usage limit reached");
  }
}

/**
 * Roll a call's tokens into the shared daily/monthly quota counters — one request, N
 * tokens. These two rollup docs are plain integers with no intent breakdown, so every AI
 * surface (including the isolated Recovery Coach, Layer 15E) shares one spend budget
 * without any of them leaking what the others were used for.
 */
export async function bumpUsageCounters(
  db: Firestore,
  uid: string,
  totalTokens: number,
  now: Date,
): Promise<void> {
  const dayRef = db.doc(`users/${uid}/aiUsageDaily/${todayKey(now)}`);
  const monthRef = db.doc(`users/${uid}/aiUsageMonthly/${monthKey(now)}`);

  const [daySnap, monthSnap] = await Promise.all([dayRef.get(), monthRef.get()]);
  const day = (daySnap.data() as UsageCounters | undefined) ?? { requestCount: 0, totalTokens: 0 };
  const month = (monthSnap.data() as UsageCounters | undefined) ?? {
    requestCount: 0,
    totalTokens: 0,
  };

  await Promise.all([
    dayRef.set({
      date: todayKey(now),
      requestCount: day.requestCount + 1,
      totalTokens: day.totalTokens + totalTokens,
      updatedAt: now.toISOString(),
    }),
    monthRef.set({
      month: monthKey(now),
      requestCount: month.requestCount + 1,
      totalTokens: month.totalTokens + totalTokens,
      updatedAt: now.toISOString(),
    }),
  ]);
}

export interface UsageRecord {
  intent: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  outcome: "success" | "error";
  costUsd: number;
}

/**
 * Rolls the call into the daily/monthly counters and writes a per-call audit record in
 * `aiCallLogs`. Used by the **general** AI endpoints (Layer 13/14). The Recovery Coach
 * (15E) deliberately does not call this — it bumps the shared counters directly and keeps
 * its per-call metrics on the `recoveryCoachSessions` document, so nothing recovery-derived
 * lands in a general collection (`docs/RECOVERY_PRIVACY.md` §1/§7).
 */
export async function recordUsage(
  db: Firestore,
  uid: string,
  usage: UsageRecord,
  now: Date,
): Promise<void> {
  const totalTokens = usage.inputTokens + usage.outputTokens;
  const logRef = db.collection(`users/${uid}/aiCallLogs`).doc();

  await Promise.all([
    bumpUsageCounters(db, uid, totalTokens, now),
    logRef.set({
      id: logRef.id,
      intent: usage.intent,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      latencyMs: usage.latencyMs,
      outcome: usage.outcome,
      costUsd: usage.costUsd,
      status: "active",
      version: 1,
      archivedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
    }),
  ]);
}

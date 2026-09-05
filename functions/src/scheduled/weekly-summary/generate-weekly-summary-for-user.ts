import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { extractJson } from "../../ai/shared/handler";
import type { AiProvider } from "../../ai/shared/ai-provider";
import { validateResponse } from "../../shared/validation";
import { collectWeekFacts } from "./collect-week-data";
import { pastWeekRange, type WeekRange } from "./week-window";
import {
  WEEKLY_SUMMARY_SYSTEM_PROMPT,
  buildWeeklySummaryPrompt,
  weeklySummaryModelOutputSchema,
} from "./weekly-summary-prompt";

const MAX_OUTPUT_TOKENS = 800;

export interface GenerateWeeklySummaryDeps {
  db: Firestore;
  provider: AiProvider;
  now?: Date;
}

export interface GenerateWeeklySummaryResult {
  summaryId: string;
}

/** A summary already exists for this exact week — makes a rerun of the job idempotent. */
async function alreadyGenerated(db: Firestore, uid: string, range: WeekRange): Promise<boolean> {
  const snap = await db
    .collection(`users/${uid}/weeklySummaries`)
    .where("weekStart", "==", range.startIso)
    .limit(1)
    .get();
  return !snap.empty;
}

/**
 * Generates (and persists) one user's weekly summary for the 7 local calendar days
 * before today, per `docs/AI_ARCHITECTURE.md` §6. Returns `null` when a summary for this
 * exact week already exists (idempotent against a rerun) or the AI provider is not
 * configured.
 */
export async function generateWeeklySummaryForUser(
  uid: string,
  timeZone: string,
  deps: GenerateWeeklySummaryDeps,
): Promise<GenerateWeeklySummaryResult | null> {
  const now = deps.now ?? new Date();
  const range = pastWeekRange(now, timeZone);

  if (await alreadyGenerated(deps.db, uid, range)) return null;

  const facts = await collectWeekFacts(deps.db, uid, range);
  const result = await deps.provider.complete({
    system: WEEKLY_SUMMARY_SYSTEM_PROMPT,
    prompt: buildWeeklySummaryPrompt(facts),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  const modelOutput = validateResponse(weeklySummaryModelOutputSchema, extractJson(result.text));

  const summaryRef = deps.db.collection(`users/${uid}/weeklySummaries`).doc();
  await summaryRef.set({
    id: summaryRef.id,
    weekStart: range.startIso,
    weekEnd: range.endIso,
    ...facts,
    lessons: modelOutput.lessons,
    suggestedPriorities: modelOutput.suggestedPriorities,
    status: "active",
    version: 1,
    archivedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });

  const notificationRef = deps.db.collection(`users/${uid}/notifications`).doc();
  await notificationRef.set({
    id: notificationRef.id,
    type: "weekly-summary",
    title: "Your weekly summary is ready",
    body: `Covering ${range.startIso} to ${range.endIso}.`,
    relatedId: summaryRef.id,
    read: false,
    status: "active",
    version: 1,
    archivedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });

  return { summaryId: summaryRef.id };
}

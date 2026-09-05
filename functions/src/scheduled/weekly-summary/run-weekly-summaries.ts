import type { Firestore } from "firebase-admin/firestore";
import type { AiProvider } from "../../ai/shared/ai-provider";
import { generateWeeklySummaryForUser } from "./generate-weekly-summary-for-user";
import { listActiveUserIds } from "./list-users";
import { localWeekday } from "./week-window";

export interface RunWeeklySummariesDeps {
  db: Firestore;
  provider: AiProvider;
  now?: Date;
}

export interface RunWeeklySummariesResult {
  /** Users whose local day was Monday and who are opted in. */
  processed: number;
  generated: number;
  errors: { uid: string; message: string }[];
}

/**
 * For every active user whose local calendar day is Monday and who hasn't opted out,
 * generates their weekly summary. One user's failure never aborts the batch.
 */
export async function runWeeklySummaries(
  deps: RunWeeklySummariesDeps,
): Promise<RunWeeklySummariesResult> {
  const now = deps.now ?? new Date();
  const userIds = await listActiveUserIds(deps.db);
  const result: RunWeeklySummariesResult = { processed: 0, generated: 0, errors: [] };

  for (const uid of userIds) {
    try {
      const profileSnap = await deps.db.doc(`users/${uid}`).get();
      const profile = profileSnap.data() as Record<string, unknown> | undefined;
      const timeZone = typeof profile?.timezone === "string" ? profile.timezone : "UTC";
      const optedIn = profile?.weeklySummaryEnabled !== false;

      if (!optedIn || localWeekday(now, timeZone) !== "Mon") continue;
      result.processed += 1;

      const generated = await generateWeeklySummaryForUser(uid, timeZone, {
        db: deps.db,
        provider: deps.provider,
        now,
      });
      if (generated) result.generated += 1;
    } catch (error) {
      result.errors.push({ uid, message: error instanceof Error ? error.message : String(error) });
    }
  }

  return result;
}

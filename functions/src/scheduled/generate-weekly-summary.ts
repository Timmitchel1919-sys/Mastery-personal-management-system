import { onSchedule } from "firebase-functions/scheduler";
import { ANTHROPIC_API_KEY, getAiProvider } from "../ai/shared/provider-factory";
import { DEFAULT_REGION } from "../config/region";
import { adminDb } from "../shared/firebase-admin";
import { runWeeklySummaries } from "./weekly-summary/run-weekly-summaries";

/**
 * Runs daily at 01:00 UTC; for every active, opted-in user whose local calendar day is
 * Monday, generates their Weekly AI Summary for the past 7 local days. See
 * `docs/AI_ARCHITECTURE.md` §6.
 */
export const generateWeeklySummary = onSchedule(
  {
    schedule: "every day 01:00",
    timeZone: "UTC",
    region: DEFAULT_REGION,
    secrets: [ANTHROPIC_API_KEY],
    timeoutSeconds: 540,
    memory: "256MiB",
  },
  async () => {
    const result = await runWeeklySummaries({ db: adminDb(), provider: getAiProvider() });
    if (result.errors.length > 0) {
      console.error(`generateWeeklySummary: ${result.errors.length} user(s) failed`, result.errors);
    }
  },
);

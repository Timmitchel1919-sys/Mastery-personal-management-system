import { onRequest } from "firebase-functions/https";
import { DEFAULT_REGION } from "./config/region";

export { masteryCoachQuery } from "./ai/mastery-coach-query";
export { generatePlanningRecommendations } from "./ai/generate-planning-recommendations";
export { generateGoalBreakdown } from "./ai/generate-goal-breakdown";
export { generateReflectionQuestions } from "./ai/generate-reflection-questions";
export { analyzeExecutionPatterns } from "./ai/analyze-execution-patterns";
export { generateWeeklySummary } from "./scheduled/generate-weekly-summary";
export { recordRecoverySetback } from "./recovery/record-recovery-setback";
export { recoveryCoachQuery } from "./recovery/recovery-coach-query";
export { configureAccountabilityPartner } from "./recovery/configure-accountability-partner";
export { getAccountabilityProjection } from "./recovery/get-accountability-projection";

/**
 * Mastery Cloud Functions entrypoint.
 *
 * Domain functions are added by later layers and re-exported here:
 *   - ai/            Layer 13 — masteryCoachQuery + the generate/analyze endpoints
 *                    (above).
 *   - scheduled/     Layer 14 — generateWeeklySummary (above); reminder sweeps join it in
 *                    Layer 17.
 *   - recovery/      Layer 15C — recordRecoverySetback (the only writer of relapse
 *                    records per RECOVERY_PRIVACY.md §3). Layer 15E — recoveryCoachQuery,
 *                    a separate, isolated AI endpoint (own system prompt + recovery-only
 *                    context + own conversation storage). Layer 15F —
 *                    configureAccountabilityPartner (the only writer of grant records) and
 *                    getAccountabilityProjection (the only way a partner sees anything —
 *                    verified-email match against an active grant, scoped projection only).
 *   - reports/       Layer 16
 *   - notifications/ Layer 17
 *
 * Written and tested through Layer 15F; NOT YET DEPLOYED — the project is on the Spark
 * plan and Cloud Functions deploy needs Blaze (owner's call, see ADR-0017).
 */

/** Unauthenticated liveness probe. Does not touch Firestore or auth. */
export const healthCheck = onRequest(
  { region: DEFAULT_REGION, cors: true, memory: "128MiB" },
  (_request, response) => {
    response.json({
      status: "ok",
      service: "mastery-functions",
      timestamp: new Date().toISOString(),
    });
  },
);

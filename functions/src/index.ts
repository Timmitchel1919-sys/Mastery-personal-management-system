import { onRequest } from "firebase-functions/https";
import { DEFAULT_REGION } from "./config/region";

/**
 * Mastery Cloud Functions entrypoint.
 *
 * Domain functions are added by later layers and re-exported here:
 *   - ai/            Layer 13 (masteryCoachQuery, generate*)
 *   - reports/       Layer 16
 *   - notifications/ Layer 17
 *   - recovery/      Layer 15 (recoveryCoachQuery, accountability access)
 *   - scheduled/     Layer 14 (generateWeeklySummary), Layer 17
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

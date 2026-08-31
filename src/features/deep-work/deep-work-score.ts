import { RATING_MAX, type DeepWorkSession } from "./schema";

/**
 * A 0–100 session score derived from focus quality, energy, how much of the planned time
 * was actually worked, and how many distractions were logged. `null` until the session is
 * marked completed. Pure — never stored, always recomputed.
 */
export function computeSessionScore(
  session: Pick<
    DeepWorkSession,
    | "sessionStatus"
    | "focusQuality"
    | "energyLevel"
    | "plannedMinutes"
    | "actualMinutes"
    | "distractions"
  >,
): number | null {
  if (session.sessionStatus !== "completed") return null;

  const focus = session.focusQuality / RATING_MAX;
  const energy = session.energyLevel / RATING_MAX;
  const adherence =
    session.plannedMinutes > 0
      ? Math.min(1, session.actualMinutes / session.plannedMinutes)
      : session.actualMinutes > 0
        ? 1
        : 0;
  const distractionFactor = Math.max(0, 1 - session.distractions.length / 10);

  const score = 0.45 * focus + 0.25 * energy + 0.2 * adherence + 0.1 * distractionFactor;
  return Math.round(score * 100);
}

import type { ActionRecord } from "./action-model";

/**
 * Per-viewer action history. A localStorage log of what Mastery actually did —
 * completed, failed, or cancelled actions — so the user can review recent
 * changes. Deliberately client-side and honest: this is not a server audit
 * trail, and it is safe to lose (private window, cleared storage).
 */

const KEY = "mastery.actions.history";
const CAP = 50;

export function readActionHistory(limit = CAP): ActionRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is ActionRecord => {
        return (
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as ActionRecord).id === "string" &&
          typeof (entry as ActionRecord).at === "string"
        );
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function recordAction(record: ActionRecord): void {
  try {
    const next = [record, ...readActionHistory(CAP)].slice(0, CAP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // history is a convenience — losing it is acceptable
  }
}

export function clearActionHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

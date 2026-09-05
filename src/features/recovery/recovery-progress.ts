import type { RecoveryCheckIn } from "./recovery-checkin-schema";

/**
 * Progress derived from check-ins — never stored (same "compute, don't duplicate" pattern
 * as habit streaks, 10B). Per `docs/RECOVERY_PRIVACY.md` §4, "emphasize long-term progress
 * over current streak length": `daysOnTrack` (the cumulative count) sits alongside the
 * streak, not behind it.
 */

export interface RecoveryProgress {
  checkInCount: number;
  currentStreak: number;
  longestStreak: number;
  daysOnTrack: number;
  averageUrge: number | null;
  lastCheckInDate: string | null;
}

type CheckInLike = Pick<RecoveryCheckIn, "date" | "stayedOnTrack" | "urgeIntensity">;

/** Consecutive most-recent days with `stayedOnTrack`, counted over check-ins sorted by date. */
function currentStreakOf(sortedDesc: CheckInLike[]): number {
  let streak = 0;
  for (const checkIn of sortedDesc) {
    if (!checkIn.stayedOnTrack) break;
    streak += 1;
  }
  return streak;
}

function longestStreakOf(sortedAsc: CheckInLike[]): number {
  let longest = 0;
  let run = 0;
  for (const checkIn of sortedAsc) {
    if (checkIn.stayedOnTrack) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  return longest;
}

export function summarizeRecoveryProgress(checkIns: CheckInLike[]): RecoveryProgress {
  if (checkIns.length === 0) {
    return {
      checkInCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      daysOnTrack: 0,
      averageUrge: null,
      lastCheckInDate: null,
    };
  }

  const sortedDesc = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  const sortedAsc = [...sortedDesc].reverse();
  const daysOnTrack = checkIns.filter((checkIn) => checkIn.stayedOnTrack).length;
  const urgeSum = checkIns.reduce((sum, checkIn) => sum + checkIn.urgeIntensity, 0);

  return {
    checkInCount: checkIns.length,
    currentStreak: currentStreakOf(sortedDesc),
    longestStreak: longestStreakOf(sortedAsc),
    daysOnTrack,
    averageUrge: Math.round((urgeSum / checkIns.length) * 10) / 10,
    lastCheckInDate: sortedDesc[0]!.date,
  };
}

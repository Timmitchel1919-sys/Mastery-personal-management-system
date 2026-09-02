import type { TimeBlock } from "./schema";

/**
 * Obvious scheduling-conflict detection for time blocks (Layer 9D spec: "detect and warn on
 * obvious scheduling conflicts"). Two blocks conflict when their time ranges overlap on the
 * absolute timeline. Comparison uses the stored ISO instants (which carry an explicit
 * offset), so blocks entered in different time zones are compared correctly. `skipped`
 * blocks are excluded — they are not really on the schedule. Pure; O(n²), fine for the
 * bounded working set.
 */

export type ConflictMap = Map<string, string[]>;

interface Interval {
  id: string;
  start: number;
  end: number;
}

function toInterval(block: TimeBlock): Interval | null {
  const start = new Date(block.startDateTime).getTime();
  const end = new Date(block.endDateTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { id: block.id, start, end };
}

export function detectConflicts(blocks: TimeBlock[]): ConflictMap {
  const intervals = blocks
    .filter((block) => block.blockStatus !== "skipped")
    .map(toInterval)
    .filter((interval): interval is Interval => interval !== null);

  const map: ConflictMap = new Map();
  for (let i = 0; i < intervals.length; i += 1) {
    for (let j = i + 1; j < intervals.length; j += 1) {
      const a = intervals[i]!;
      const b = intervals[j]!;
      if (a.start < b.end && b.start < a.end) {
        map.set(a.id, [...(map.get(a.id) ?? []), b.id]);
        map.set(b.id, [...(map.get(b.id) ?? []), a.id]);
      }
    }
  }
  return map;
}

/** Number of distinct blocks involved in at least one conflict. */
export function conflictedBlockCount(map: ConflictMap): number {
  return map.size;
}

import type { JournalEntry } from "./schema";

export interface JournalStats {
  total: number;
  last7Days: number;
  avgMood: number | null;
  avgEnergy: number | null;
  distinctTags: number;
}

function daysAgo(dateIso: string, todayIso: string): number {
  const ms = Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${dateIso}T00:00:00Z`);
  return ms / 86_400_000;
}

/** Roll a set of journal entries into headline stats. Pure. */
export function summarizeJournal(
  entries: JournalEntry[],
  today: string = new Date().toISOString().slice(0, 10),
): JournalStats {
  if (entries.length === 0) {
    return { total: 0, last7Days: 0, avgMood: null, avgEnergy: null, distinctTags: 0 };
  }

  let last7Days = 0;
  let moodSum = 0;
  let energySum = 0;
  const tags = new Set<string>();

  for (const entry of entries) {
    const age = daysAgo(entry.entryDate, today);
    if (age >= 0 && age < 7) last7Days += 1;
    moodSum += entry.moodRating;
    energySum += entry.energyLevel;
    for (const tag of entry.tags) tags.add(tag);
  }

  const round1 = (value: number) => Math.round(value * 10) / 10;

  return {
    total: entries.length,
    last7Days,
    avgMood: round1(moodSum / entries.length),
    avgEnergy: round1(energySum / entries.length),
    distinctTags: tags.size,
  };
}

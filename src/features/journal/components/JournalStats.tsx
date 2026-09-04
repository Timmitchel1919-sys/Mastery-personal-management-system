import { Card, CardContent } from "@/components/ui";
import type { JournalStats as Stats } from "../journal-stats";

export function JournalStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: "Entries", value: String(stats.total), hint: `${stats.last7Days} in the last 7 days` },
    { label: "Avg. mood", value: stats.avgMood === null ? "—" : `${stats.avgMood}/5` },
    { label: "Avg. energy", value: stats.avgEnergy === null ? "—" : `${stats.avgEnergy}/5` },
    { label: "Tags used", value: String(stats.distinctTags) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="p-4">
            <p className="text-subtle text-xs">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</p>
            {tile.hint ? <p className="text-subtle mt-0.5 text-xs">{tile.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

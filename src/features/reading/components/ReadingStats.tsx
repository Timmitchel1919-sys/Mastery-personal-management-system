import { Card, CardContent } from "@/components/ui";
import type { ReadingStats as Stats } from "../reading-stats";

export function ReadingStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: "Books", value: String(stats.total) },
    { label: "Currently reading", value: String(stats.currentlyReading) },
    { label: "Want to read", value: String(stats.wantToRead) },
    {
      label: "Completed",
      value: String(stats.completed),
      hint: `${stats.completedLast30Days} in the last 30 days`,
    },
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

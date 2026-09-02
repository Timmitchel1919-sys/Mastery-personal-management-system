import { Card, CardContent } from "@/components/ui";
import type { TimeBlockStats as Stats } from "../time-block-stats";

function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  if (rounded < 60) return `${rounded}m`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function TimeBlockStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    {
      label: "Scheduled",
      value: formatMinutes(stats.scheduledMinutes),
      hint: `${stats.blocks} blocks`,
    },
    {
      label: "Completed",
      value: formatMinutes(stats.completedMinutes),
      hint: `${stats.done} done`,
    },
    { label: "Planned blocks", value: String(stats.planned), hint: `${stats.skipped} skipped` },
    {
      label: "Conflicts",
      value: String(stats.conflictedBlocks),
      hint: stats.conflictedBlocks === 0 ? "none" : "overlapping blocks",
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

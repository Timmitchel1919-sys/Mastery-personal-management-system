import { Card, CardContent } from "@/components/ui";
import type { TaskStats as Stats } from "../task-stats";

export function TaskStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: "Open", value: String(stats.open), hint: `${stats.total} total` },
    { label: "Due today", value: String(stats.dueToday) },
    {
      label: "Overdue",
      value: String(stats.overdue),
      hint: stats.blocked > 0 ? `${stats.blocked} blocked` : undefined,
    },
    { label: "Done", value: String(stats.done) },
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

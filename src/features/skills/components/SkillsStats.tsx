import { Card, CardContent } from "@/components/ui";
import type { SkillsStats as Stats } from "../skill-stats";

export function SkillsStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string }[] = [
    { label: "Skills", value: String(stats.total) },
    { label: "Due for review", value: String(stats.dueForReview) },
    {
      label: "Avg. progress to target",
      value: stats.avgProgressToTarget === null ? "—" : `${stats.avgProgressToTarget}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="p-4">
            <p className="text-subtle text-xs">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui";
import type { KpisStats as Stats } from "../kpi-stats";

export function KpisStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string }[] = [
    { label: "KPIs", value: String(stats.total) },
    { label: "With entries", value: String(stats.withEntries) },
    {
      label: "Avg. attainment",
      value: stats.avgAttainment === null ? "—" : `${stats.avgAttainment}%`,
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

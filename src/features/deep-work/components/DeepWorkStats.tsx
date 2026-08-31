import { Card, CardContent } from "@/components/ui";
import type { DeepWorkStats as Stats } from "../deep-work-stats";

function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  if (rounded < 60) return `${rounded}m`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function DeepWorkStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: "Focus last 7 days", value: formatMinutes(stats.last7DaysMinutes) },
    {
      label: "Total focus",
      value: formatMinutes(stats.focusMinutes),
      hint: `${stats.completed} completed`,
    },
    {
      label: "Avg score",
      value: stats.avgScore === null ? "—" : String(stats.avgScore),
      hint: stats.avgFocusQuality === null ? undefined : `focus ${stats.avgFocusQuality}/5`,
    },
    {
      label: "Distractions",
      value: String(stats.distractions),
      hint: `${stats.sessions} sessions`,
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

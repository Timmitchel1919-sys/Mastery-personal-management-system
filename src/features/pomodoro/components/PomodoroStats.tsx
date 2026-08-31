import { Card, CardContent } from "@/components/ui";
import type { PomodoroStats as Stats } from "../pomodoro-stats";

function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  if (rounded < 60) return `${rounded}m`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function PomodoroStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: "Focus today", value: formatMinutes(stats.todayFocusMinutes) },
    {
      label: "Focus (recent)",
      value: formatMinutes(stats.focusMinutes),
      hint: `${stats.workIntervals} intervals`,
    },
    {
      label: "Sessions",
      value: String(stats.sessions),
      hint: `${stats.completed} completed · ${stats.abandoned} ended early`,
    },
    { label: "Avg / session", value: formatMinutes(stats.avgFocusMinutes) },
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

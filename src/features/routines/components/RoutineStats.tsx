import { Card, CardContent } from "@/components/ui";
import type { RoutinesStats } from "../routine-stats";

export function RoutineStats({ stats }: { stats: RoutinesStats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    {
      label: "Routines",
      value: String(stats.activeRoutines),
      hint: `${stats.templates} templates`,
    },
    {
      label: "Steps today",
      value: `${stats.stepsCompletedToday}/${stats.stepsTotalToday}`,
    },
    { label: "Minutes planned", value: String(stats.minutesPlannedToday) },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

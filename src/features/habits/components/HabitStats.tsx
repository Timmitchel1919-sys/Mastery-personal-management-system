import { Card, CardContent } from "@/components/ui";
import type { HabitsStats } from "../habit-stats";

export function HabitStats({ stats }: { stats: HabitsStats }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    {
      label: "Active habits",
      value: String(stats.activeHabits),
      hint: `${stats.pausedHabits} paused`,
    },
    { label: "Due today", value: String(stats.dueToday) },
    { label: "Done today", value: String(stats.completedToday) },
    { label: "Best streak", value: String(stats.bestCurrentStreak) },
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

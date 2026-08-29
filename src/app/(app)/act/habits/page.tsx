import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Habits" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Habits"
      description="Habit tracking with streaks, schedules, and progress history."
      plannedLayer={10}
    />
  );
}

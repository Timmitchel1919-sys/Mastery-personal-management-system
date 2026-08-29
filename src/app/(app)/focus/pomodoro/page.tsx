import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Pomodoro" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Pomodoro"
      description="Configurable focus cycles with persistent session state."
      plannedLayer={9}
    />
  );
}

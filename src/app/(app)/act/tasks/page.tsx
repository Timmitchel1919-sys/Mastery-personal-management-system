import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Tasks" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Tasks"
      description="Task management with subtasks, recurrence, and effort tracking."
      plannedLayer={10}
    />
  );
}

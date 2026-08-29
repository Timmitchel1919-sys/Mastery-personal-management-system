import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Goals" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Goals"
      description="Measurable goals with milestones, projects, tasks, habits, and KPIs."
      plannedLayer={8}
    />
  );
}

import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Daily Routine" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Daily Routine"
      description="Morning, work, and evening routines from reusable templates."
      plannedLayer={10}
    />
  );
}

import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Calendar" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Calendar"
      description="Internal calendar with day, week, and month views."
      plannedLayer={9}
    />
  );
}

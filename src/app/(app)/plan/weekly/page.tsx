import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Weekly Plans" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Weekly Plans"
      description="Weekly priorities that feed your daily actions."
      plannedLayer={8}
    />
  );
}

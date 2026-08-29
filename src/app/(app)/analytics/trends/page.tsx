import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Trends" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Trends"
      description="Time-series views and comparisons across your metrics."
      plannedLayer={12}
    />
  );
}

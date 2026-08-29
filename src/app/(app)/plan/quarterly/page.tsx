import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Quarterly Plans" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Quarterly Plans"
      description="Quarter objectives that cascade from your one-year plan."
      plannedLayer={8}
    />
  );
}

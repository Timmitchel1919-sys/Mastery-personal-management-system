import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Weekly, monthly, quarterly, and annual reports with PDF export."
      plannedLayer={16}
    />
  );
}

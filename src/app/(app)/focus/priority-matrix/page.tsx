import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Priority Matrix" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Priority Matrix"
      description="Sort tasks across the urgent and important quadrants."
      plannedLayer={9}
    />
  );
}

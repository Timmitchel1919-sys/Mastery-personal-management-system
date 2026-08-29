import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Journal" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Journal"
      description="Free-form and guided reflection with mood and energy metadata."
      plannedLayer={11}
    />
  );
}

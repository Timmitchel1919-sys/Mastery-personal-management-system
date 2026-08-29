import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Deep Work" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Deep Work"
      description="Focused work sessions with intended outcomes and a distraction log."
      plannedLayer={9}
    />
  );
}

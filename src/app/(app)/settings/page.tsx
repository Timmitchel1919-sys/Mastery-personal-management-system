import { ModulePlaceholder } from "@/components/layout";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Profile, language, theme, notifications, and privacy."
      plannedLayer={18}
    />
  );
}

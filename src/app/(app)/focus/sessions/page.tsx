import type { Metadata } from "next";
import { SubmoduleWorkspace } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Focus Sessions" };

export default function Page() {
  return (
    <SubmoduleWorkspace
      module="focus"
      submoduleId="sessions"
      title="Focus Sessions"
      description="History and statistics for your focus work."
      state="empty"
      emptyTitle="No focus session history yet"
      emptyDescription="Run a Deep Work or Pomodoro session and it will show up here."
    />
  );
}

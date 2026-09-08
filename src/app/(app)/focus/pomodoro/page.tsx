import type { Metadata } from "next";
import { PomodoroView } from "@/features/pomodoro";
import { SubmoduleWorkspace } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Pomodoro" };

export default function Page() {
  return (
    <SubmoduleWorkspace module="focus" submoduleId="pomodoro">
      <PomodoroView />
    </SubmoduleWorkspace>
  );
}

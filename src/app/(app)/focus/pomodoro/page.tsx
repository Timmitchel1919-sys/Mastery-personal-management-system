import type { Metadata } from "next";
import { PomodoroView } from "@/features/pomodoro";

export const metadata: Metadata = { title: "Pomodoro" };

export default function Page() {
  return <PomodoroView />;
}

import type { Metadata } from "next";
import { CalendarView } from "@/features/calendar";
import { SubmoduleWorkspace } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return (
    <SubmoduleWorkspace module="focus" submoduleId="calendar">
      <CalendarView />
    </SubmoduleWorkspace>
  );
}

import type { Metadata } from "next";
import { TimeBlockView } from "@/features/time-blocking";
import { SubmoduleWorkspace } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Time Blocking" };

export default function Page() {
  return (
    <SubmoduleWorkspace module="focus" submoduleId="time-blocking">
      <TimeBlockView />
    </SubmoduleWorkspace>
  );
}

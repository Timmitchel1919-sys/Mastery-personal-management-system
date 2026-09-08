import type { Metadata } from "next";
import { PriorityMatrixView } from "@/features/priority-matrix";
import { SubmoduleWorkspace } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Priority Matrix" };

export default function Page() {
  return (
    <SubmoduleWorkspace module="focus" submoduleId="priority-matrix">
      <PriorityMatrixView />
    </SubmoduleWorkspace>
  );
}

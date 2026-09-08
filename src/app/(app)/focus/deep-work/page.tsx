import type { Metadata } from "next";
import { DeepWorkView } from "@/features/deep-work";
import { SubmoduleWorkspace } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Deep Work" };

export default function Page() {
  return (
    <SubmoduleWorkspace module="focus" submoduleId="deep-work">
      <DeepWorkView />
    </SubmoduleWorkspace>
  );
}

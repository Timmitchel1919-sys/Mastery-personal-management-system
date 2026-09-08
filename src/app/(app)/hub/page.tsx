import type { Metadata } from "next";
import { BrainHubView } from "@/features/brain-hub";

export const metadata: Metadata = { title: "Brain Hub" };

export default function Page() {
  return <BrainHubView />;
}

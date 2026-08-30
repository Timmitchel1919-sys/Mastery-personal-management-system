import type { Metadata } from "next";
import { MilestonesView } from "@/features/milestones";

export const metadata: Metadata = { title: "Milestones" };

export default function Page() {
  return <MilestonesView />;
}

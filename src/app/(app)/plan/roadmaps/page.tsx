import type { Metadata } from "next";
import { RoadmapsView } from "@/features/roadmaps";

export const metadata: Metadata = { title: "Roadmaps" };

export default function Page() {
  return <RoadmapsView />;
}

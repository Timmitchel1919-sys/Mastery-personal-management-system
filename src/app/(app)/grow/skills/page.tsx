import type { Metadata } from "next";
import { SkillsView } from "@/features/skills";

export const metadata: Metadata = { title: "Skills" };

export default function Page() {
  return <SkillsView />;
}

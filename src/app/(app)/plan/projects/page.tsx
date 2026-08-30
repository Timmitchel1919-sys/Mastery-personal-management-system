import type { Metadata } from "next";
import { ProjectsView } from "@/features/projects";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <ProjectsView />;
}

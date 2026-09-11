import type { Metadata } from "next";
import { KnowledgeHubView } from "@/features/context";

export const metadata: Metadata = { title: "Knowledge Hub" };

export default function KnowledgePage() {
  return <KnowledgeHubView />;
}

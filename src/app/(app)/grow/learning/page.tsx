import type { Metadata } from "next";
import { LearningView } from "@/features/learning";

export const metadata: Metadata = { title: "Learning" };

export default function Page() {
  return <LearningView />;
}

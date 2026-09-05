import type { Metadata } from "next";
import { AiCoachView } from "@/features/ai-coach";

export const metadata: Metadata = { title: "AI Coach" };

export default function Page() {
  return <AiCoachView />;
}

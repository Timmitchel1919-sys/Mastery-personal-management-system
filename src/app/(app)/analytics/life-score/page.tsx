import type { Metadata } from "next";
import { LifeScoreView } from "@/features/life-score";

export const metadata: Metadata = { title: "Life Score" };

export default function Page() {
  return <LifeScoreView />;
}

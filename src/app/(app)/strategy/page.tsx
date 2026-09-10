import type { Metadata } from "next";
import { StrategyView } from "@/features/strategy";

export const metadata: Metadata = { title: "Strategy" };

export default function StrategyPage() {
  return <StrategyView />;
}

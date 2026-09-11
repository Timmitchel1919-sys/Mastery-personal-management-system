import type { Metadata } from "next";
import { AdaptationCenterView } from "@/features/adaptation";

export const metadata: Metadata = { title: "Adaptation" };

export default function AdaptationPage() {
  return <AdaptationCenterView />;
}

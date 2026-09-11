import type { Metadata } from "next";
import { ForesightView } from "@/features/foresight";

export const metadata: Metadata = { title: "Predictions" };

export default function PredictionsPage() {
  return <ForesightView />;
}

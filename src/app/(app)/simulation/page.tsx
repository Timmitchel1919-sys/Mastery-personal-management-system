import type { Metadata } from "next";
import { SimulationView } from "@/features/twin";

export const metadata: Metadata = { title: "Simulation" };

export default function SimulationPage() {
  return <SimulationView />;
}

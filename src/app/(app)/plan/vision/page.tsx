import type { Metadata } from "next";
import { LifeVisionView } from "@/features/vision";

export const metadata: Metadata = { title: "Life Vision" };

export default function Page() {
  return <LifeVisionView />;
}

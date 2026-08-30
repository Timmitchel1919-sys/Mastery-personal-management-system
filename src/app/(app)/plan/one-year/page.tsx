import type { Metadata } from "next";
import { PlansView } from "@/features/plans";

export const metadata: Metadata = { title: "One-Year Plans" };

export default function Page() {
  return <PlansView horizon="one-year" />;
}

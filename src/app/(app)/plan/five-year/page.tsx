import type { Metadata } from "next";
import { PlansView } from "@/features/plans";

export const metadata: Metadata = { title: "Five-Year Plans" };

export default function Page() {
  return <PlansView horizon="five-year" />;
}

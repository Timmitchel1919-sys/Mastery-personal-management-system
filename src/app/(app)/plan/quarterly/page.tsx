import type { Metadata } from "next";
import { PlansView } from "@/features/plans";

export const metadata: Metadata = { title: "Quarterly Plans" };

export default function Page() {
  return <PlansView horizon="quarter" />;
}

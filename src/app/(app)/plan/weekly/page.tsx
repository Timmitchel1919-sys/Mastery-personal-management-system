import type { Metadata } from "next";
import { PlansView } from "@/features/plans";

export const metadata: Metadata = { title: "Weekly Plans" };

export default function Page() {
  return <PlansView horizon="week" />;
}

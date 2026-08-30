import type { Metadata } from "next";
import { PlansView } from "@/features/plans";

export const metadata: Metadata = { title: "Monthly Plans" };

export default function Page() {
  return <PlansView horizon="month" />;
}

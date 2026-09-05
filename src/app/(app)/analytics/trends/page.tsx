import type { Metadata } from "next";
import { TrendsView } from "@/features/trends";

export const metadata: Metadata = { title: "Trends" };

export default function Page() {
  return <TrendsView />;
}

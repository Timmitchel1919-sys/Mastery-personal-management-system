import type { Metadata } from "next";
import { ReadingView } from "@/features/reading";

export const metadata: Metadata = { title: "Reading" };

export default function Page() {
  return <ReadingView />;
}

import type { Metadata } from "next";
import { JournalView } from "@/features/journal";

export const metadata: Metadata = { title: "Journal" };

export default function Page() {
  return <JournalView />;
}

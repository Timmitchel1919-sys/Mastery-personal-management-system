import type { Metadata } from "next";
import { TimeBlockView } from "@/features/time-blocking";

export const metadata: Metadata = { title: "Time Blocking" };

export default function Page() {
  return <TimeBlockView />;
}

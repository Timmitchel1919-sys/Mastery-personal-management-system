import type { Metadata } from "next";
import { PriorityMatrixView } from "@/features/priority-matrix";

export const metadata: Metadata = { title: "Priority Matrix" };

export default function Page() {
  return <PriorityMatrixView />;
}

import type { Metadata } from "next";
import { ExecutionTrackerView } from "@/features/execution-tracker";

export const metadata: Metadata = { title: "Execution Tracker" };

export default function Page() {
  return <ExecutionTrackerView />;
}

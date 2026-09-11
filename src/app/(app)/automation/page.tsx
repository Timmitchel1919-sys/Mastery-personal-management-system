import type { Metadata } from "next";
import { AutomationCenterView } from "@/features/governance";

export const metadata: Metadata = { title: "Automation Center" };

export default function AutomationPage() {
  return <AutomationCenterView />;
}

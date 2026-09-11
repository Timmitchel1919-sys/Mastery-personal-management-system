import type { Metadata } from "next";
import { TrustCenterView } from "@/features/autonomy";

export const metadata: Metadata = { title: "Trust Center" };

export default function OperationsPage() {
  return <TrustCenterView />;
}

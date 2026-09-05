import type { Metadata } from "next";
import { RecoveryGate, RecoveryHomeView } from "@/features/recovery";

export const metadata: Metadata = { title: "Recovery Center" };

export default function Page() {
  return (
    <RecoveryGate>
      <RecoveryHomeView />
    </RecoveryGate>
  );
}

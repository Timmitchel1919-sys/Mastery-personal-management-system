import type { Metadata } from "next";
import { KpisView } from "@/features/kpis";

export const metadata: Metadata = { title: "KPIs" };

export default function Page() {
  return <KpisView />;
}

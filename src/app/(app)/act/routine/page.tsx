import type { Metadata } from "next";
import { RoutinesView } from "@/features/routines";

export const metadata: Metadata = { title: "Daily Routine" };

export default function Page() {
  return <RoutinesView />;
}

import type { Metadata } from "next";
import { CascadeView } from "@/features/cascade";

export const metadata: Metadata = { title: "Planning Cascade" };

export default function Page() {
  return <CascadeView />;
}

import type { Metadata } from "next";
import { DeepWorkView } from "@/features/deep-work";

export const metadata: Metadata = { title: "Deep Work" };

export default function Page() {
  return <DeepWorkView />;
}

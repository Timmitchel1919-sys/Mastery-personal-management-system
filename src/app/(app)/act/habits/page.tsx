import type { Metadata } from "next";
import { HabitsView } from "@/features/habits";

export const metadata: Metadata = { title: "Habits" };

export default function Page() {
  return <HabitsView />;
}

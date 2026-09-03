import type { Metadata } from "next";
import { TasksView } from "@/features/tasks";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return <TasksView />;
}

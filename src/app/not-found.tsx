import Link from "next/link";
import { EmptyState } from "@/components/shared";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6">
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        action={
          <Link
            href="/"
            className="text-primary text-sm underline underline-offset-4 hover:opacity-80"
          >
            Back to start
          </Link>
        }
      />
    </main>
  );
}

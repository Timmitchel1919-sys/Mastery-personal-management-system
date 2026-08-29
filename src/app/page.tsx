import Link from "next/link";
import { Button } from "@/components/ui";

/**
 * Placeholder root route. Replaced by the authenticated application shell and entry
 * routing in Layer 5. User-facing copy moves into the i18n layer in Layer 18.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-muted text-xs font-medium tracking-[0.2em] uppercase">
        Plan · Focus · Act · Grow
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Mastery</h1>
      <p className="text-muted max-w-prose">
        The project foundation is in place. Authentication, navigation, and the module surface are
        added in later build layers.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Create an account</Link>
        </Button>
      </div>
      <p className="text-subtle text-xs">
        <Link href="/api/health" className="underline underline-offset-4 hover:opacity-80">
          Health check
        </Link>
      </p>
    </main>
  );
}

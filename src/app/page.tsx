import Link from "next/link";

/**
 * Placeholder root route. Replaced by the authenticated application shell and entry
 * routing in Layer 5. User-facing copy moves into the i18n layer in Layer 18.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-muted text-xs font-medium tracking-[0.2em] uppercase">
        Plan · Focus · Act · Grow
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Mastery</h1>
      <p className="text-muted max-w-prose">
        The project foundation is in place. Authentication, navigation, and the module surface are
        added in later build layers.
      </p>
      <p className="text-sm">
        <Link
          href="/api/health"
          className="text-primary underline underline-offset-4 hover:opacity-80"
        >
          Health check
        </Link>
      </p>
    </main>
  );
}

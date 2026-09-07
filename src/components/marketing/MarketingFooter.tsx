import Link from "next/link";
import { Logo } from "@/components/ui";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo variant="mark" height={18} withLabel={false} />
          <span className="text-subtle text-sm">© {year} Mastery. All rights reserved.</span>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-6">
          <Link href="/login" className="text-muted hover:text-foreground text-sm">
            Log In
          </Link>
          <Link href="/register" className="text-muted hover:text-foreground text-sm">
            Get Started
          </Link>
        </nav>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui";

const NAV_GROUPS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Overview", href: "#product" },
      { label: "Modules", href: "#modules" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Philosophy", href: "#philosophy" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Create account", href: "/register" },
      { label: "Log in", href: "/login" },
    ],
  },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo variant="full" height={22} />
          <p className="text-subtle mt-3 max-w-xs text-sm leading-relaxed">
            A personal operating system for planning, focus, execution, growth, and
            measurable progress.
          </p>
        </div>

        {NAV_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-foreground text-xs font-semibold tracking-[0.08em] uppercase">
              {group.heading}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className="text-muted hover:text-foreground text-sm">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-muted hover:text-foreground text-sm">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-border border-t">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-6">
          <span className="text-subtle text-xs">
            © {year} Mastery. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

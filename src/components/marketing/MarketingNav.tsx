"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Button,
  IconButton,
  Logo,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#framework", label: "Framework" },
  { href: "#about", label: "About" },
];

/**
 * Public marketing navigation. Lightweight glass at rest; past a small scroll
 * threshold the bar picks up a touch more opacity so it stays legible over
 * whatever content is scrolling beneath it.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "mastery-glass fixed inset-x-4 top-3 z-40 mx-auto flex h-16 max-w-6xl items-center",
        "justify-between rounded-2xl px-4 transition-colors sm:px-6",
        scrolled && "bg-surface-raised/90",
      )}
    >
      <Link href="/" aria-label="Mastery" className="flex items-center">
        <Logo variant="full" height={24} />
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-muted hover:text-foreground text-sm font-medium transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="hidden items-center gap-3 lg:flex">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Get Started</Link>
        </Button>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <IconButton aria-label="Open menu" icon={<Menu />} className="lg:hidden" />
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <div className="border-border flex items-center justify-between border-b p-4">
            <SheetTitle asChild>
              <Logo variant="full" height={22} />
            </SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
          </div>
          <nav aria-label="Primary" className="flex flex-col gap-1 p-4">
            {LINKS.map((link) => (
              <SheetClose key={link.href} asChild>
                <a
                  href={link.href}
                  className="text-foreground hover:bg-surface rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  {link.label}
                </a>
              </SheetClose>
            ))}
          </nav>
          <div className="border-border mt-auto flex flex-col gap-2 border-t p-4">
            <Button asChild variant="outline">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

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
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#framework", label: "Framework" },
  { href: "#about", label: "About" },
];

/**
 * Floating glass navigation — a rounded translucent bar that sits over the mountain
 * hero rather than a solid website navbar. Gains opacity + a soft shadow once the
 * page is scrolled.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={cn(
          "mastery-glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-3 transition-all duration-200 sm:px-5",
          scrolled ? "shadow-[0_18px_45px_rgb(15_23_42_/_0.12)]" : "shadow-none",
        )}
        data-scrolled={scrolled}
      >
        <Link href="/" aria-label="Mastery" className="flex items-center">
          <Logo variant="full" height={26} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted hover:text-foreground text-sm font-medium tracking-tight transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild size="sm" className="px-4">
            <Link href="/register">Get Started</Link>
          </Button>
          <InstallAppButton size="sm" showFallbackText={false} />
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
              <InstallAppButton showFallbackText={false} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

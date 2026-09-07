"use client";

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

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#framework", label: "Framework" },
  { href: "#about", label: "About" },
];

export function MarketingNav() {
  return (
    <header className="bg-surface-raised border-border fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-4 sm:px-6">
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
            <InstallAppButton showFallbackText={false} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

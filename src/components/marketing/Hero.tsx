import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Hero — the promise, not the pitch. Sits over the mountain atmosphere from
 * `<HeroBackground />` (see page.tsx). One gold accent on "Life." ties the headline to
 * the brand mark; nothing else competes.
 */
export function Hero() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-40 pb-8 text-center sm:pt-48">
      <p className="text-primary mb-6 text-xs font-semibold tracking-[0.16em] uppercase">
        AI-Powered Personal Operating System
      </p>
      <h1 className="text-foreground text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
        Master Your <span className="text-primary">Life.</span>
      </h1>
      <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed text-balance sm:text-xl">
        Plan with intention. Focus on what matters. Act with discipline. Grow with purpose.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="px-7">
          <Link href="/register">
            Start Your Mastery
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#product">Explore MASTERY</a>
        </Button>
      </div>
      <span aria-hidden="true" className="bg-gold-connector mt-12 h-px w-16" />
      <p className="text-subtle mt-4 text-sm italic">Discipline today. A greater tomorrow.</p>
    </div>
  );
}

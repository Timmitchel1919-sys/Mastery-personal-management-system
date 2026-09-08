import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "./Reveal";
import { SystemOrbit } from "./SystemOrbit";

/**
 * Hero — the promise and the system, side by side. Copy on the left, the live
 * Mastery orbit on the right (stacks below `lg`). One gold accent on "Life." ties
 * the headline to the brand mark.
 */
export function Hero() {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-32 pb-16 sm:pt-40 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-44">
      <Reveal className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <p className="text-eyebrow mb-5">Personal Operating System</p>
        <h1 className="text-foreground text-5xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Master Your <span className="text-primary">Life.</span>
        </h1>
        <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed text-balance sm:text-xl">
          Your personal operating system for planning, focus, execution, growth, and
          measurable progress.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
          <Button asChild size="lg" className="px-7">
            <Link href="/register">
              Start Mastery
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#modules">Explore Mastery</a>
          </Button>
        </div>
        <span aria-hidden="true" className="bg-gold-connector mt-10 h-px w-16" />
        <p className="text-subtle mt-4 text-sm italic">Discipline today. A greater tomorrow.</p>
      </Reveal>

      <Reveal delay={120}>
        <SystemOrbit />
      </Reveal>
    </div>
  );
}

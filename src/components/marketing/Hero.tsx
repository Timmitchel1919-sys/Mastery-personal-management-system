import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "./Reveal";
import { LandingBrainExperience } from "./LandingBrainExperience";

/**
 * Hero — promise + interactive brain. Visitors can immediately explore the same
 * six-system navigation concept used inside the authenticated app.
 */
export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-32 pb-16 sm:pt-40 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:pt-44">
      <Reveal className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <p className="text-eyebrow mb-5">Personal Operating System</p>
        <h1 className="text-foreground text-5xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Master Your <span className="text-primary">Life.</span>
        </h1>
        <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed text-balance sm:text-xl">
          MASTERY unifies Goals, Plan, Focus, Act, Grow, and Analytics into one operating
          system so intention becomes execution and progress becomes intelligence.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
          <Button asChild size="lg" className="px-7">
            <Link href="/register">
              Get Started
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#preview">Explore MASTERY</a>
          </Button>
        </div>
        <span aria-hidden="true" className="bg-gold-connector mt-10 h-px w-16" />
        <p className="text-subtle mt-4 text-sm italic">
          MASTERY does not make decisions for you. MASTERY makes your decisions better.
        </p>
      </Reveal>

      <Reveal delay={120}>
        <LandingBrainExperience />
      </Reveal>
    </section>
  );
}

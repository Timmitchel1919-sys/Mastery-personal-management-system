import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "./Reveal";

export function CtaSection() {
  return (
    <section className="mastery-ambient py-24 sm:py-32">
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
        <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Build your system. Master your life.
        </h2>
        <p className="text-muted mt-5 max-w-lg text-base leading-relaxed sm:text-lg">
          Bring your plans, goals, focus, execution, and growth into one system.
        </p>
        <Button asChild size="lg" className="mt-9 px-8">
          <Link href="/register">
            Start Mastery
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </Reveal>
    </section>
  );
}

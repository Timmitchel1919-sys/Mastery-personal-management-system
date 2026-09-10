import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "./Reveal";

export function CtaSection() {
  return (
    <section className="mastery-ambient py-24 sm:py-32">
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
        <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Build your system. Master your execution.
        </h2>
        <p className="text-muted mt-5 max-w-lg text-base leading-relaxed sm:text-lg">
          Start your personal operating system and move from intention to meaningful action.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="px-8">
            <Link href="/register">
              Start with MASTERY
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

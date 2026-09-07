import Link from "next/link";
import { Button } from "@/components/ui";

export function CtaSection() {
  return (
    <div id="about" className="mastery-ambient py-24 sm:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
        <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Mastery is a system for intentional living.
        </h2>
        <p className="text-muted mt-5 max-w-lg text-base leading-relaxed sm:text-lg">
          Not another productivity app — a discipline you build, one planned week at a time.
        </p>
        <Button asChild size="lg" className="mt-8 px-8">
          <Link href="/register">Start Your Mastery</Link>
        </Button>
      </div>
    </div>
  );
}

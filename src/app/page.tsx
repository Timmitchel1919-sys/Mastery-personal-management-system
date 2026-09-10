import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { ModulesGrid } from "@/components/marketing/ModulesGrid";
import { SystemFlow } from "@/components/marketing/SystemFlow";
import { OneSystem } from "@/components/marketing/OneSystem";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { CtaSection } from "@/components/marketing/CtaSection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Mastery — Master Your Life",
  description:
    "MASTERY is an AI-powered personal operating system: Goals, Plan, Focus, Act, Grow, and Analytics connected through an interactive Brain Hub.",
  openGraph: {
    title: "Mastery — Master Your Life",
    description:
      "Experience the MASTERY Personal Operating System before sign in: Brain Hub navigation, six connected systems, and a real product preview.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main className="bg-background relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden
        className="mastery-ambient pointer-events-none absolute inset-x-0 top-0 -z-10 h-225"
      />
      <MarketingNav />
      <Hero />
      <ModulesGrid />
      <SystemFlow />
      <OneSystem />
      <ProductPreview />
      <CtaSection />
      <MarketingFooter />
    </main>
  );
}

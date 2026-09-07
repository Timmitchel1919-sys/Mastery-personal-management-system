import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { ValueProps } from "@/components/marketing/ValueProps";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Framework } from "@/components/marketing/Framework";
import { AiSection } from "@/components/marketing/AiSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Mastery — Master Your Life",
  description:
    "Mastery is a personal operating system: plan with intention, focus on what matters, act with discipline, and grow with purpose across every dimension of life.",
};

export default function LandingPage() {
  return (
    <main className="bg-background min-h-dvh overflow-x-hidden">
      <MarketingNav />
      <div className="mastery-ambient">
        <Hero />
        <ProductPreview />
      </div>
      <ValueProps />
      <HowItWorks />
      <Framework />
      <AiSection />
      <CtaSection />
      <MarketingFooter />
    </main>
  );
}

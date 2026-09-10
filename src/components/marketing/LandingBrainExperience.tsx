"use client";

import { useRouter } from "next/navigation";
import { BrainHub } from "@/features/brain-hub";

/**
 * Landing-page host for the real Brain Hub interaction model. Selecting a module
 * stays on-page (preview mode); only the explicit open action enters auth.
 */
export function LandingBrainExperience() {
  const router = useRouter();

  return (
    <section
      id="experience"
      aria-label="Interactive Mastery brain preview"
      className="mastery-glass mastery-glass--gold rounded-3xl p-4 sm:p-6"
    >
      <p className="text-eyebrow mb-2">Interactive Brain Preview</p>
      <p className="text-muted mb-5 max-w-2xl text-sm leading-relaxed">
        Explore the six systems before sign in. This is preview mode: navigation and structure
        are real, while workspaces stay read-only until you create an account.
      </p>
      <BrainHub onOpen={(module) => router.push(`/register?module=${module.id}`)} />
    </section>
  );
}

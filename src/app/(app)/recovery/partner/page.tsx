import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingState } from "@/components/shared";
import { PartnerProjectionPage } from "@/features/recovery";

export const metadata: Metadata = { title: "Shared with you" };

/**
 * Partner-facing view (Layer 15F). Not behind the Recovery Center PIN gate — the viewer is
 * the accountability partner, not the owner. `getAccountabilityProjection` still checks
 * their verified email against an active grant before returning anything.
 */
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PartnerProjectionPage />
    </Suspense>
  );
}

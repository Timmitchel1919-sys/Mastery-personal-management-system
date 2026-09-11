"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useAutonomy } from "../use-autonomy";

/**
 * Layer R → Layer N integration. A deliberately small Command Center strip:
 * pending approvals / running / failed counts and a link to the Trust Center.
 * Renders nothing when there is no autonomous activity and nothing is paused.
 */
export function PendingApprovalsPanel() {
  const { pending, running, failed, paused } = useAutonomy();

  if (pending.length === 0 && running.length === 0 && failed.length === 0 && !paused) {
    return null;
  }

  return (
    <section
      aria-labelledby="cc-autonomy-heading"
      className="mastery-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5"
    >
      <div>
        <h2 id="cc-autonomy-heading" className="text-eyebrow flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Autonomous operations
        </h2>
        <p className="text-muted mt-1 text-sm">
          {paused ? "Automations paused. " : ""}
          {pending.length} awaiting approval · {running.length} running · {failed.length} failed
        </p>
      </div>
      <Button asChild size="sm" variant="ghost">
        <Link href="/operations">Open Trust Center</Link>
      </Button>
    </section>
  );
}

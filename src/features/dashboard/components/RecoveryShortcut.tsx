import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { Card } from "@/components/ui";

/**
 * Privacy-safe shortcut to the Recovery Center. Shows no streak, count, or any other
 * detail — just a way in. The module opens behind its own privacy gate (Layer 15).
 */
export function RecoveryShortcut() {
  return (
    <Card>
      <Link
        href="/recovery"
        className="focus-visible:ring-ring flex items-center gap-3 rounded-lg p-4 outline-none focus-visible:ring-2"
      >
        <span className="bg-surface text-muted flex size-9 shrink-0 items-center justify-center rounded-md">
          <Lock className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Recovery Center</span>
          <span className="text-subtle block text-xs">Private check-in</span>
        </span>
        <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
}

"use client";

import { Lock } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { useRecoveryLock } from "../use-recovery-lock";

const UPCOMING = [
  { label: "Recovery goals & daily check-ins", layer: "15B–15C" },
  { label: "Coping toolkit", layer: "15D" },
  { label: "Recovery Coach", layer: "15E" },
  { label: "Accountability partner", layer: "15F" },
] as const;

/** Shown once the privacy gate (Layer 15A) is unlocked. */
export function RecoveryHomeView() {
  const { lock } = useRecoveryLock();

  return (
    <PageContainer>
      <PageHeader
        title="Recovery Center"
        description="Private. Never shown on your dashboard, in search, or in ordinary notifications."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button variant="outline" onClick={lock}>
            <Lock />
            Lock
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <div>
            <h3 className="font-medium">Your privacy here</h3>
            <ul className="text-muted mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Kept out of your dashboard, global search, and ordinary notifications.</li>
              <li>Stored in separately protected records, visible only to you.</li>
              <li>Any Recovery Coach conversation stays isolated from your general AI Coach.</li>
              <li>
                Locked again automatically after 15 minutes, or any time with the Lock button above.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Coming next</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {UPCOMING.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <Badge variant="outline">Layer {item.layer}</Badge>
                  <span className="text-muted">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui";
import { ACCOUNTABILITY_SCOPE_LABEL } from "../recovery-accountability-schema";
import { useAccountabilityProjection } from "../use-accountability-projection";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-subtle text-xs">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Partner-facing page — renders only the scoped projection the owner shared. */
export function PartnerProjectionView({
  ownerUid,
  partnerId,
}: {
  ownerUid: string | null;
  partnerId: string | null;
}) {
  const { status, projection, error } = useAccountabilityProjection(ownerUid, partnerId);

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Shared with you"
        description="A narrow view someone chose to share. You can't see anything else."
        breadcrumbs={<BreadcrumbTrail />}
      />

      {status === "loading" ? (
        <Skeleton className="h-40" />
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[30vh]"
          title="This shared view isn't available"
          description={error ?? "It may have been revoked or expired."}
        />
      ) : projection ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold break-words">{projection.goalBehavior}</h2>
              <Badge variant="outline">{ACCOUNTABILITY_SCOPE_LABEL[projection.scope]}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {projection.recoveryStatus !== null ? (
                <Stat label="Status" value={projection.recoveryStatus} />
              ) : null}
              {projection.currentStreak !== null ? (
                <Stat label="Current streak" value={`${projection.currentStreak}d`} />
              ) : null}
              {projection.daysOnTrack !== null ? (
                <Stat label="Days on track" value={String(projection.daysOnTrack)} />
              ) : null}
              {projection.checkedInToday !== null ? (
                <Stat
                  label="Checked in today"
                  value={projection.checkedInToday ? "Yes" : "Not yet"}
                />
              ) : null}
              {projection.lastCheckInDate !== null ? (
                <Stat label="Last check-in" value={projection.lastCheckInDate || "—"} />
              ) : null}
              {projection.setbackCount !== null ? (
                <Stat label="Setbacks logged" value={String(projection.setbackCount)} />
              ) : null}
            </div>

            <p className="text-subtle text-xs">
              Updated {new Date(projection.generatedAt).toLocaleString()}. No notes, triggers,
              setback details, or coach conversations are ever shared here.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}

/** Route wrapper — pulls the owner/grant ids from the query string. Wrap in <Suspense>. */
export function PartnerProjectionPage() {
  const params = useSearchParams();
  return <PartnerProjectionView ownerUid={params.get("owner")} partnerId={params.get("grant")} />;
}

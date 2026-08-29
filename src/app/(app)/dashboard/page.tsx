"use client";

import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";

/** Placeholder authenticated landing. The real dashboard aggregation is Layer 7. */
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const name = profile?.displayName ?? user?.displayName ?? user?.email ?? "there";

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${name}`}
        description="Authentication and user isolation are in place."
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-2 text-sm">
          <p>Your profile is stored privately under your account and restores across devices.</p>
          <p>Navigation, planning, focus, and act modules arrive in the following layers.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

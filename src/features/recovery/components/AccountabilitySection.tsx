"use client";

import { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { Badge, Button, IconButton } from "@/components/ui";
import { ErrorState } from "@/components/shared";
import { useAuth } from "@/providers/auth-provider";
import {
  ACCOUNTABILITY_SCOPE_LABEL,
  type AccountabilityFormValues,
  type RecoveryAccountabilityPartner,
} from "../recovery-accountability-schema";
import { useRecoveryAccountability } from "../use-recovery-accountability";
import { AccountabilityPartnerDialog } from "./AccountabilityPartnerDialog";

function toRequest(goalId: string, editing: RecoveryAccountabilityPartner | null) {
  return (values: AccountabilityFormValues) =>
    editing
      ? {
          op: "update" as const,
          partnerId: editing.id,
          partnerLabel: values.partnerLabel,
          scope: values.scope,
          customFields: values.customFields,
          includeSetbackCount: values.includeSetbackCount,
          sendCheckInReminders: values.sendCheckInReminders,
          expiresAt: values.expiresAt || null,
        }
      : {
          op: "create" as const,
          goalId,
          partnerEmail: values.partnerEmail,
          partnerLabel: values.partnerLabel,
          scope: values.scope,
          customFields: values.customFields,
          includeSetbackCount: values.includeSetbackCount,
          sendCheckInReminders: values.sendCheckInReminders,
          expiresAt: values.expiresAt || null,
        };
}

function PartnerRow({
  partner,
  shareLink,
  onEdit,
  onRevoke,
}: {
  partner: RecoveryAccountabilityPartner;
  shareLink: string | null;
  onEdit: (partner: RecoveryAccountabilityPartner) => void;
  onRevoke: (partner: RecoveryAccountabilityPartner) => void;
}) {
  const revoked = partner.revokedAt != null;
  return (
    <li className="rounded-md border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium break-words">{partner.partnerLabel}</span>
            <Badge variant={revoked ? "neutral" : "outline"}>
              {ACCOUNTABILITY_SCOPE_LABEL[partner.scope]}
            </Badge>
            {revoked ? <Badge variant="neutral">Revoked</Badge> : null}
          </div>
          <p className="text-subtle text-xs break-words">{partner.partnerEmail}</p>
          {partner.expiresAt && !revoked ? (
            <p className="text-subtle text-xs">Access ends {partner.expiresAt}</p>
          ) : null}
          {shareLink && !revoked ? (
            <p className="text-subtle mt-1 text-xs break-all">
              Send them: <code>{shareLink}</code>
            </p>
          ) : null}
        </div>
        {!revoked ? (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="sm" onClick={() => onEdit(partner)}>
              Edit
            </Button>
            <IconButton
              size="sm"
              aria-label={`Revoke access for ${partner.partnerLabel}`}
              icon={<UserMinus />}
              onClick={() => onRevoke(partner)}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function AccountabilitySection({ goalId }: { goalId: string }) {
  const { user } = useAuth();
  const { status, partners, error, reload, configure, saving, saveError } =
    useRecoveryAccountability(goalId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecoveryAccountabilityPartner | null>(null);

  const shareLinkFor = (partnerId: string) =>
    user ? `/recovery/partner?owner=${user.uid}&grant=${partnerId}` : null;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(partner: RecoveryAccountabilityPartner) {
    setEditing(partner);
    setDialogOpen(true);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Accountability partner</h3>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <UserPlus />
          Share with a partner
        </Button>
      </div>
      <p className="text-subtle text-sm">
        Optional. Share a narrow slice of this goal with someone you trust — a streak, a status, or
        a short summary. You can change or revoke it any time.
      </p>

      {saveError ? <p className="text-danger text-sm">{saveError}</p> : null}

      {status === "error" ? (
        <ErrorState
          title="We couldn't load your partners"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : status === "loading" ? (
        <p className="text-subtle text-sm">Loading…</p>
      ) : partners.length === 0 ? (
        <p className="text-subtle text-sm">No one has access. Add a partner above.</p>
      ) : (
        <ul className="space-y-2">
          {partners.map((partner) => (
            <PartnerRow
              key={partner.id}
              partner={partner}
              shareLink={shareLinkFor(partner.id)}
              onEdit={openEdit}
              onRevoke={(target) => configure({ op: "revoke", partnerId: target.id })}
            />
          ))}
        </ul>
      )}

      <AccountabilityPartnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goalId={goalId}
        editing={editing}
        onSubmit={async (values) => {
          await configure(toRequest(goalId, editing)(values));
        }}
      />

      {saving ? <p className="text-subtle text-xs">Saving…</p> : null}
    </section>
  );
}

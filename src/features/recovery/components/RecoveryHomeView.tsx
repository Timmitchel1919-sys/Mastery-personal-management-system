"use client";

import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Badge, Button, Card, CardContent, Skeleton } from "@/components/ui";
import { useRecoveryLock } from "../use-recovery-lock";
import { useRecoveryGoals } from "../use-recovery-goals";
import { recoveryGoalInputFromForm, type RecoveryGoal } from "../recovery-goal-schema";
import { RecoveryGoalCard } from "./RecoveryGoalCard";
import { RecoveryGoalDetailView } from "./RecoveryGoalDetailView";
import { RecoveryGoalDialog } from "./RecoveryGoalDialog";

const UPCOMING = [
  { label: "Recovery Coach", layer: "15E" },
  { label: "Accountability partner", layer: "15F" },
] as const;

/** Shown once the privacy gate (Layer 15A) is unlocked. */
export function RecoveryHomeView() {
  const { lock } = useRecoveryLock();
  const { status, items, error, reload, create, update, archive } = useRecoveryGoals();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecoveryGoal | null>(null);
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(goal: RecoveryGoal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  const openGoal = openGoalId ? (items.find((goal) => goal.id === openGoalId) ?? null) : null;

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Recovery Center"
        description="Private. Never shown on your dashboard, in search, or in ordinary notifications."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={lock}>
              <Lock />
              Lock
            </Button>
            {!openGoal ? (
              <Button onClick={openCreate} disabled={status === "loading"}>
                <Plus />
                New recovery goal
              </Button>
            ) : null}
          </div>
        }
      />

      {openGoal ? (
        <RecoveryGoalDetailView goal={openGoal} onBack={() => setOpenGoalId(null)} />
      ) : (
        <RecoveryGoalsList
          status={status}
          items={items}
          error={error}
          onReload={reload}
          onCreate={openCreate}
          onOpen={(goal) => setOpenGoalId(goal.id)}
          onEdit={openEdit}
          onArchive={archive}
        />
      )}

      <RecoveryGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        onSubmit={async (values) => {
          const input = recoveryGoalInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />
    </PageContainer>
  );
}

interface RecoveryGoalsListProps {
  status: "loading" | "ready" | "error";
  items: RecoveryGoal[];
  error: string | null;
  onReload: () => void;
  onCreate: () => void;
  onOpen: (goal: RecoveryGoal) => void;
  onEdit: (goal: RecoveryGoal) => void;
  onArchive: (id: string) => Promise<void>;
}

function RecoveryGoalsList({
  status,
  items,
  error,
  onReload,
  onCreate,
  onOpen,
  onEdit,
  onArchive,
}: RecoveryGoalsListProps) {
  return (
    <>
      <Card>
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
            <p className="text-subtle mt-2 text-xs">
              This is a personal planning space, not medical or psychological advice, and does not
              replace a licensed professional.
            </p>
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

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-52" />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[30vh]"
          title="We couldn't load your recovery goals"
          description={error ?? "Please try again."}
          onRetry={onReload}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No recovery goals yet"
          description="Add one whenever you're ready — there's no rush."
          action={
            <Button onClick={onCreate}>
              <Plus />
              Add your first goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((goal) => (
            <RecoveryGoalCard
              key={goal.id}
              goal={goal}
              onOpen={onOpen}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </>
  );
}

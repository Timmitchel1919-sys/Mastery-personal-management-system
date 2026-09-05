"use client";

import { useState } from "react";
import { ArrowLeft, CalendarCheck, RotateCcw } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { ErrorState } from "@/components/shared";
import { HALT_LABEL, recoveryCheckInInputFromForm, type Halt } from "../recovery-checkin-schema";
import { RECOVERY_GOAL_STATUS_LABEL, type RecoveryGoal } from "../recovery-goal-schema";
import { recoveryRelapseRequestFromForm } from "../recovery-relapse-schema";
import { useRecoveryCheckIns } from "../use-recovery-checkins";
import { useRecoveryRelapses } from "../use-recovery-relapses";
import { CheckInDialog } from "./CheckInDialog";
import { CopingToolkitSection } from "./CopingToolkitSection";
import { RelapseLogDialog } from "./RelapseLogDialog";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-subtle text-xs">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function activeHalt(halt: Halt): string[] {
  return (Object.keys(halt) as (keyof Halt)[])
    .filter((key) => halt[key])
    .map((key) => HALT_LABEL[key]);
}

export function RecoveryGoalDetailView({
  goal,
  onBack,
}: {
  goal: RecoveryGoal;
  onBack: () => void;
}) {
  const checkIns = useRecoveryCheckIns(goal.id);
  const relapses = useRecoveryRelapses(goal.id);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [relapseOpen, setRelapseOpen] = useState(false);

  const { progress } = checkIns;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All goals
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCheckInOpen(true)}>
            <CalendarCheck />
            Check in
          </Button>
          <Button variant="ghost" onClick={() => setRelapseOpen(true)}>
            <RotateCcw />
            Log a setback
          </Button>
        </div>
      </div>

      <div>
        <Badge variant="outline">{RECOVERY_GOAL_STATUS_LABEL[goal.recoveryStatus]}</Badge>
        <h2 className="mt-1 text-lg font-semibold break-words">{goal.behavior}</h2>
      </div>

      <Card>
        <CardContent className="p-4">
          {checkIns.status === "error" ? (
            <ErrorState
              title="We couldn't load your check-ins"
              description={checkIns.error ?? "Please try again."}
              onRetry={checkIns.reload}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Current streak" value={`${progress.currentStreak}d`} />
              <Stat label="Longest streak" value={`${progress.longestStreak}d`} />
              <Stat label="Days on track" value={String(progress.daysOnTrack)} />
              <Stat
                label="Avg. urge"
                value={progress.averageUrge === null ? "—" : String(progress.averageUrge)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="font-semibold">Recent check-ins</h3>
        {checkIns.status === "loading" ? (
          <p className="text-subtle text-sm">Loading…</p>
        ) : checkIns.items.length === 0 ? (
          <p className="text-subtle text-sm">No check-ins yet. Add your first above.</p>
        ) : (
          <ul className="space-y-2">
            {checkIns.items.slice(0, 14).map((entry) => (
              <li key={entry.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{entry.date}</span>
                  <Badge variant={entry.stayedOnTrack ? "success" : "warning"}>
                    {entry.stayedOnTrack ? "On track" : "Hard day"}
                  </Badge>
                  <span className="text-subtle text-xs">urge {entry.urgeIntensity}</span>
                  {activeHalt(entry.halt).length > 0 ? (
                    <span className="text-subtle text-xs">
                      HALT: {activeHalt(entry.halt).join(", ")}
                    </span>
                  ) : null}
                </div>
                {entry.reflection ? (
                  <p className="text-muted mt-1 break-words whitespace-pre-wrap">
                    {entry.reflection}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CopingToolkitSection goalId={goal.id} faithBased={goal.faithBasedEncouragement} />

      <section className="space-y-3">
        <h3 className="font-semibold">Setbacks</h3>
        {relapses.status === "error" ? (
          <p className="text-subtle text-sm">{relapses.error}</p>
        ) : relapses.status === "loading" ? (
          <p className="text-subtle text-sm">Loading…</p>
        ) : relapses.items.length === 0 ? (
          <p className="text-subtle text-sm">None logged.</p>
        ) : (
          <ul className="space-y-2">
            {relapses.items.map((entry) => (
              <li key={entry.id} className="rounded-md border p-3 text-sm">
                <span className="font-medium">{entry.date}</span>
                <p className="text-muted mt-1 break-words whitespace-pre-wrap">
                  {entry.whatHappened}
                </p>
                {entry.restartPlan ? (
                  <p className="text-subtle mt-1 break-words whitespace-pre-wrap">
                    Restart plan: {entry.restartPlan}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CheckInDialog
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        goalId={goal.id}
        onSubmit={async (values) => {
          await checkIns.submitCheckIn(recoveryCheckInInputFromForm(values));
        }}
      />

      <RelapseLogDialog
        open={relapseOpen}
        onOpenChange={setRelapseOpen}
        goalId={goal.id}
        logging={relapses.logging}
        error={relapses.logError}
        onSubmit={async (values) => {
          const ok = await relapses.logSetback(recoveryRelapseRequestFromForm(goal.id, values));
          if (ok) checkIns.reload();
          return ok;
        }}
      />
    </div>
  );
}

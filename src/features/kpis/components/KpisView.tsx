"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useKpis } from "../use-kpis";
import { kpiEntryInputFromForm, kpiInputFromForm, type Kpi } from "../schema";
import { AddKpiEntryDialog } from "./AddKpiEntryDialog";
import { KpiCard } from "./KpiCard";
import { KpiDialog } from "./KpiDialog";
import { KpisStats } from "./KpisStats";

export function KpisView() {
  const { status, items, entriesByKpi, stats, error, reload, create, update, archive, addEntry } =
    useKpis();
  const { options: goalOptions } = useGoalOptions();

  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Kpi | null>(null);
  const [loggingFor, setLoggingFor] = useState<Kpi | null>(null);

  const goalTitleById = useMemo(
    () => new Map(goalOptions.map((option) => [option.id, option.title])),
    [goalOptions],
  );

  function openCreate() {
    setEditing(null);
    setKpiDialogOpen(true);
  }
  function openEdit(kpi: Kpi) {
    setEditing(kpi);
    setKpiDialogOpen(true);
  }
  function openAddEntry(kpi: Kpi) {
    setLoggingFor(kpi);
    setEntryDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="KPIs"
        description="KPI definitions and entries across the three life pillars."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={openCreate} disabled={status === "loading"}>
            <Plus />
            New KPI
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-52" />
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your KPIs"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <KpisStats stats={stats} />

          {items.length === 0 ? (
            <EmptyState
              title="No KPIs yet"
              description="Define a metric you want to track, with a target and a direction."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first KPI
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((kpi) => (
                <KpiCard
                  key={kpi.id}
                  kpi={kpi}
                  entries={entriesByKpi.get(kpi.id) ?? []}
                  goalTitleById={goalTitleById}
                  onEdit={openEdit}
                  onArchive={archive}
                  onAddEntry={openAddEntry}
                />
              ))}
            </div>
          )}
        </>
      )}

      <KpiDialog
        open={kpiDialogOpen}
        onOpenChange={setKpiDialogOpen}
        kpi={editing}
        goalOptions={goalOptions}
        onSubmit={async (values) => {
          const input = kpiInputFromForm(values);
          if (editing) await update(editing.id, input);
          else await create(input);
        }}
      />

      <AddKpiEntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        kpi={loggingFor}
        onSubmit={async (values) => {
          if (!loggingFor) return;
          await addEntry(kpiEntryInputFromForm(loggingFor.id, values));
        }}
      />
    </PageContainer>
  );
}

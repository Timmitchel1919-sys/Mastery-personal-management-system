"use client";

import { useState } from "react";
import { Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { PillarBadges, Sparkline } from "@/components/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Progress,
} from "@/components/ui";
import { latestEntry } from "../kpi-stats";
import { KPI_DIRECTION_LABEL, kpiAttainment, type Kpi, type KpiEntry } from "../schema";

interface KpiCardProps {
  kpi: Kpi;
  entries: KpiEntry[];
  goalTitleById: Map<string, string>;
  onEdit: (kpi: Kpi) => void;
  onArchive: (id: string) => Promise<void>;
  onAddEntry: (kpi: Kpi) => void;
}

export function KpiCard({
  kpi,
  entries,
  goalTitleById,
  onEdit,
  onArchive,
  onAddEntry,
}: KpiCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const latest = latestEntry(entries);
  const attainment = latest ? kpiAttainment(kpi, latest.value) : null;
  const link = kpi.goalId ? goalTitleById.get(kpi.goalId) : undefined;
  const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {kpi.category ? <Badge variant="outline">{kpi.category}</Badge> : null}
              <Badge variant="neutral">{KPI_DIRECTION_LABEL[kpi.direction]}</Badge>
              {attainment !== null ? <Badge variant="primary">{attainment}%</Badge> : null}
            </div>
            <h3 className="mt-1 font-medium break-words">{kpi.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit KPI"
              icon={<Pencil />}
              onClick={() => onEdit(kpi)}
            />
            <IconButton
              size="sm"
              aria-label="Archive KPI"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {kpi.description ? (
          <p className="text-muted text-sm break-words whitespace-pre-wrap">{kpi.description}</p>
        ) : null}

        {attainment !== null ? <Progress value={attainment} /> : null}

        <div className="text-subtle flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {latest ? (
            <span>
              latest {latest.value}
              {kpi.unit ? ` ${kpi.unit}` : ""} on {latest.date}
            </span>
          ) : (
            <span>No entries yet</span>
          )}
          {kpi.targetValue !== null ? (
            <span>
              target {kpi.targetValue}
              {kpi.unit ? ` ${kpi.unit}` : ""}
            </span>
          ) : null}
          {link ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden="true" />
              {link}
            </span>
          ) : null}
        </div>

        {chronological.length > 1 ? (
          <Sparkline
            points={chronological.map((entry) => ({ date: entry.date, value: entry.value }))}
            targetValue={kpi.targetValue}
            ariaLabel={`${kpi.title} trend over its last ${chronological.length} entries`}
          />
        ) : null}

        {kpi.pillarIds.length > 0 ? <PillarBadges pillars={kpi.pillarIds} /> : null}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onAddEntry(kpi)}>
            <Plus />
            Add entry
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this KPI?</DialogTitle>
            <DialogDescription>
              It is removed from your KPI list and excluded from the Life Score. This does not
              delete logged entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={archiving}
              onClick={async () => {
                setArchiving(true);
                try {
                  await onArchive(kpi.id);
                  setConfirmOpen(false);
                } finally {
                  setArchiving(false);
                }
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

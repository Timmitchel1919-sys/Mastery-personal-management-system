"use client";

import { useState } from "react";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { PillarBadges } from "@/components/shared";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MATRIX_QUADRANT_META,
  MATRIX_QUADRANTS,
  type MatrixItem,
  type MatrixQuadrant,
} from "../schema";

interface MatrixItemCardProps {
  item: MatrixItem;
  goalTitleById: Map<string, string>;
  projectTitleById: Map<string, string>;
  onEdit: (item: MatrixItem) => void;
  onArchive: (id: string) => Promise<void>;
  onMove: (id: string, quadrant: MatrixQuadrant) => Promise<unknown>;
  onToggleComplete: (id: string, completed: boolean) => Promise<unknown>;
}

export function MatrixItemCard({
  item,
  goalTitleById,
  projectTitleById,
  onEdit,
  onArchive,
  onMove,
  onToggleComplete,
}: MatrixItemCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const link =
    (item.goalId ? goalTitleById.get(item.goalId) : undefined) ??
    (item.projectId ? projectTitleById.get(item.projectId) : undefined);

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start gap-2">
          <Checkbox
            className="mt-0.5"
            checked={item.completed}
            aria-label={item.completed ? "Mark as not done" : "Mark as done"}
            onCheckedChange={(checked) => onToggleComplete(item.id, checked === true)}
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium break-words",
                item.completed && "text-subtle line-through",
              )}
            >
              {item.title}
            </p>
            {item.note ? (
              <p className="text-subtle mt-0.5 text-xs break-words whitespace-pre-wrap">
                {item.note}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit item"
              icon={<Pencil />}
              onClick={() => onEdit(item)}
            />
            <IconButton
              size="sm"
              aria-label="Archive item"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        {(link || item.pillarIds.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {item.pillarIds.length > 0 ? <PillarBadges pillars={item.pillarIds} /> : null}
            {link ? (
              <span className="text-subtle inline-flex items-center gap-1 text-xs">
                <Link2 className="size-3.5" aria-hidden="true" />
                {link}
              </span>
            ) : null}
          </div>
        )}

        <Select
          value={item.quadrant}
          onValueChange={(next) => onMove(item.id, next as MatrixQuadrant)}
        >
          <SelectTrigger aria-label="Move to quadrant" className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MATRIX_QUADRANTS.map((quadrant) => (
              <SelectItem key={quadrant} value={quadrant}>
                {MATRIX_QUADRANT_META[quadrant].label} — {MATRIX_QUADRANT_META[quadrant].summary}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this item?</DialogTitle>
            <DialogDescription>
              It is removed from the matrix. This does not delete the record.
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
                  await onArchive(item.id);
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

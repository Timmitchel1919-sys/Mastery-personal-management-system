"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
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
} from "@/components/ui";
import { PillarBadges } from "@/components/shared";
import { LIFE_VISION_CATEGORY_META, type LifeVision } from "../schema";

interface VisionItemCardProps {
  item: LifeVision;
  onEdit: (item: LifeVision) => void;
  onArchive: (id: string) => Promise<void>;
}

export function VisionItemCard({ item, onEdit, onArchive }: VisionItemCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const meta = LIFE_VISION_CATEGORY_META[item.category];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-subtle text-xs font-medium tracking-wide uppercase">{meta.label}</p>
            <h3 className="mt-0.5 font-medium break-words">{item.title}</h3>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton
              size="sm"
              aria-label="Edit vision item"
              icon={<Pencil />}
              onClick={() => onEdit(item)}
            />
            <IconButton
              size="sm"
              aria-label="Archive vision item"
              icon={<Trash2 />}
              onClick={() => setConfirmOpen(true)}
            />
          </div>
        </div>

        <p className="text-muted text-sm break-words whitespace-pre-wrap">{item.content}</p>
        <PillarBadges pillars={item.pillarIds} />
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this vision item?</DialogTitle>
            <DialogDescription>
              It is removed from your Life Vision. This does not delete the record.
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

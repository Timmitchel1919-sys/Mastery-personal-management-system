"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { VisionItemForm } from "./VisionItemForm";
import type { LifeVision, LifeVisionCreate } from "../schema";

interface VisionItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this item; otherwise it creates a new one. */
  item?: LifeVision | null;
  onSubmit: (values: LifeVisionCreate) => Promise<void>;
}

export function VisionItemDialog({ open, onOpenChange, item, onSubmit }: VisionItemDialogProps) {
  const editing = Boolean(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit vision item" : "Add a vision item"}</DialogTitle>
          <DialogDescription>
            Vision sits at the top of the planning cascade — everything else traces back to it.
          </DialogDescription>
        </DialogHeader>
        <VisionItemForm
          key={item?.id ?? "new"}
          submitLabel={editing ? "Save changes" : "Add item"}
          defaultValues={
            item
              ? {
                  category: item.category,
                  title: item.title,
                  content: item.content,
                  pillarIds: item.pillarIds,
                }
              : undefined
          }
          onSubmit={async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

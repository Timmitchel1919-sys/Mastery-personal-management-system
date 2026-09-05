"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Textarea,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import { saveScoreFormSchema, type SaveScoreFormValues } from "../schema";

interface SaveScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number | null;
  onSubmit: (values: SaveScoreFormValues) => Promise<void>;
}

export function SaveScoreDialog({ open, onOpenChange, score, onSubmit }: SaveScoreDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SaveScoreFormValues>({
    resolver: zodResolver(saveScoreFormSchema),
    defaultValues: { note: "" },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (caught) {
      setFormError(normalizeError(caught).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{`Save today's score${score !== null ? ` — ${score}` : ""}`}</DialogTitle>
          <DialogDescription>
            {"Freezes today's Life Score and its contributing factors into your history."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {formError ? (
            <Alert variant="danger">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FormField label="Note" optional>
            <Textarea rows={2} placeholder="Context for today, if any" {...register("note")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

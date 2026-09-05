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
  Input,
  Textarea,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import { kpiEntryFormSchema, type Kpi, type KpiEntryFormValues } from "../schema";

interface EntryFormProps {
  unit: string;
  onSubmit: (values: KpiEntryFormValues) => Promise<void>;
  onCancel: () => void;
}

function EntryForm({ unit, onSubmit, onCancel }: EntryFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KpiEntryFormValues>({
    resolver: zodResolver(kpiEntryFormSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), value: 0, note: "" },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (caught) {
      setFormError(normalizeError(caught).message);
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </FormField>
        <FormField label={unit ? `Value (${unit})` : "Value"} error={errors.value?.message}>
          <Input type="number" step="any" {...register("value", { valueAsNumber: true })} />
        </FormField>
      </div>

      <FormField label="Note" optional error={errors.note?.message}>
        <Textarea rows={2} placeholder="Anything worth remembering" {...register("note")} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Add entry
        </Button>
      </DialogFooter>
    </form>
  );
}

interface AddKpiEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: Kpi | null;
  onSubmit: (values: KpiEntryFormValues) => Promise<void>;
}

export function AddKpiEntryDialog({ open, onOpenChange, kpi, onSubmit }: AddKpiEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add an entry{kpi ? ` — ${kpi.title}` : ""}</DialogTitle>
          <DialogDescription>Log today&apos;s (or a past) reading for this KPI.</DialogDescription>
        </DialogHeader>
        <EntryForm
          key={kpi?.id ?? "none"}
          unit={kpi?.unit ?? ""}
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

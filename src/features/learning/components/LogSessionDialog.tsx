"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import { studySessionFormSchema, type LearningItem, type StudySessionFormValues } from "../schema";

const NONE = "__none__";

interface LogSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: LearningItem[];
  onSubmit: (values: StudySessionFormValues) => Promise<void>;
}

export function LogSessionDialog({ open, onOpenChange, items, onSubmit }: LogSessionDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudySessionFormValues>({
    resolver: zodResolver(studySessionFormSchema),
    defaultValues: {
      learningItemId: "",
      date: new Date().toISOString().slice(0, 10),
      minutes: 30,
      notes: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      reset({
        learningItemId: "",
        date: new Date().toISOString().slice(0, 10),
        minutes: 30,
        notes: "",
      });
      onOpenChange(false);
    } catch (caught) {
      setFormError(normalizeError(caught).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log a study session</DialogTitle>
          <DialogDescription>Track time spent, linked to an item or on its own.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {formError ? (
            <Alert variant="danger">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Controller
            control={control}
            name="learningItemId"
            render={({ field }) => (
              <FormField
                label="Learning item"
                htmlFor="session-item"
                error={errors.learningItemId?.message}
              >
                <Select
                  value={field.value || NONE}
                  onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
                >
                  <SelectTrigger id="session-item">
                    <SelectValue placeholder="General study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>General study</SelectItem>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" error={errors.date?.message}>
              <Input type="date" {...register("date")} />
            </FormField>
            <FormField label="Minutes" error={errors.minutes?.message}>
              <Input
                type="number"
                min={1}
                max={600}
                {...register("minutes", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField label="Notes" optional error={errors.notes?.message}>
            <Textarea rows={2} placeholder="What did you cover?" {...register("notes")} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Log session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

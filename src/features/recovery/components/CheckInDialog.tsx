"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import {
  EMPTY_HALT,
  HALT_LABEL,
  MAX_URGE,
  recoveryCheckInFormSchema,
  type Halt,
  type RecoveryCheckInFormValues,
} from "../recovery-checkin-schema";

const URGE_OPTIONS = Array.from({ length: MAX_URGE + 1 }, (_, i) => i);
const HALT_KEYS = Object.keys(EMPTY_HALT) as (keyof Halt)[];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CheckInFormProps {
  onSubmit: (values: RecoveryCheckInFormValues) => Promise<void>;
  onCancel: () => void;
}

function CheckInForm({ onSubmit, onCancel }: CheckInFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryCheckInFormValues>({
    resolver: zodResolver(recoveryCheckInFormSchema),
    defaultValues: {
      date: todayIso(),
      stayedOnTrack: true,
      urgeIntensity: 0,
      halt: EMPTY_HALT,
      triggersTodayText: "",
      copingUsedText: "",
      reflection: "",
    },
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

      <Controller
        control={control}
        name="stayedOnTrack"
        render={({ field }) => (
          <FormField label="Did you stay on track today?" htmlFor="checkin-track">
            <Switch id="checkin-track" checked={field.value} onCheckedChange={field.onChange} />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="urgeIntensity"
        render={({ field }) => (
          <FormField label="Strongest urge today (0–10)" htmlFor="checkin-urge">
            <Select
              value={String(field.value)}
              onValueChange={(next) => field.onChange(Number(next))}
            >
              <SelectTrigger id="checkin-urge">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URGE_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <FormField label="HALT" description="Check any that fit right now.">
        <div className="flex flex-wrap gap-4">
          {HALT_KEYS.map((key) => (
            <Controller
              key={key}
              control={control}
              name={`halt.${key}` as const}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  {HALT_LABEL[key]}
                </label>
              )}
            />
          ))}
        </div>
      </FormField>

      <FormField
        label="Triggers that came up"
        htmlFor="checkin-triggers"
        description="One per line."
      >
        <Textarea id="checkin-triggers" rows={2} {...register("triggersTodayText")} />
      </FormField>

      <FormField label="What helped" htmlFor="checkin-coping" description="One per line.">
        <Textarea id="checkin-coping" rows={2} {...register("copingUsedText")} />
      </FormField>

      <FormField label="Reflection" optional error={errors.reflection?.message}>
        <Textarea
          rows={2}
          placeholder="Anything you want to remember about today"
          {...register("reflection")}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save check-in
        </Button>
      </DialogFooter>
    </form>
  );
}

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  onSubmit: (values: RecoveryCheckInFormValues) => Promise<void>;
}

export function CheckInDialog({ open, onOpenChange, goalId, onSubmit }: CheckInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily check-in</DialogTitle>
          <DialogDescription>A quick note on how today went. One per day.</DialogDescription>
        </DialogHeader>
        <CheckInForm
          key={goalId}
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

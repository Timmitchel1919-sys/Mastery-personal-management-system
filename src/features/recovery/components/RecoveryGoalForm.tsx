"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  FormField,
  Input,
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
  RECOVERY_GOAL_STATUSES,
  RECOVERY_GOAL_STATUS_LABEL,
  recoveryGoalFormSchema,
  type RecoveryGoalFormValues,
} from "../recovery-goal-schema";

export interface RecoveryGoalFormProps {
  defaultValues?: Partial<RecoveryGoalFormValues>;
  submitLabel: string;
  onSubmit: (values: RecoveryGoalFormValues) => Promise<void>;
  onCancel: () => void;
}

export function RecoveryGoalForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: RecoveryGoalFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryGoalFormValues>({
    resolver: zodResolver(recoveryGoalFormSchema),
    defaultValues: {
      behavior: defaultValues?.behavior ?? "",
      description: defaultValues?.description ?? "",
      motivation: defaultValues?.motivation ?? "",
      startDate: defaultValues?.startDate ?? "",
      triggersText: defaultValues?.triggersText ?? "",
      warningSignsText: defaultValues?.warningSignsText ?? "",
      copingStrategiesText: defaultValues?.copingStrategiesText ?? "",
      supportNotes: defaultValues?.supportNotes ?? "",
      faithBasedEncouragement: defaultValues?.faithBasedEncouragement ?? false,
      recoveryStatus: defaultValues?.recoveryStatus ?? "active",
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

      <FormField label="What are you working on?" error={errors.behavior?.message}>
        <Input placeholder="In your own words" {...register("behavior")} />
      </FormField>

      <FormField label="A bit more context" optional error={errors.description?.message}>
        <Textarea rows={2} {...register("description")} />
      </FormField>

      <FormField label="Why this matters to you" optional error={errors.motivation?.message}>
        <Textarea
          rows={2}
          placeholder="Your reasons, for when it gets hard"
          {...register("motivation")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Started" optional error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <Controller
          control={control}
          name="recoveryStatus"
          render={({ field }) => (
            <FormField
              label="Right now"
              htmlFor="recovery-status"
              error={errors.recoveryStatus?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="recovery-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOVERY_GOAL_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {RECOVERY_GOAL_STATUS_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <FormField
        label="Triggers"
        htmlFor="recovery-triggers"
        description="One per line — situations or feelings that pull you toward it."
      >
        <Textarea id="recovery-triggers" rows={3} {...register("triggersText")} />
      </FormField>

      <FormField
        label="Early warning signs"
        htmlFor="recovery-warnings"
        description="One per line."
      >
        <Textarea id="recovery-warnings" rows={3} {...register("warningSignsText")} />
      </FormField>

      <FormField
        label="Coping strategies"
        htmlFor="recovery-coping"
        description="One per line — what you plan to do instead."
      >
        <Textarea id="recovery-coping" rows={3} {...register("copingStrategiesText")} />
      </FormField>

      <FormField label="Support notes" optional error={errors.supportNotes?.message}>
        <Textarea
          rows={2}
          placeholder="What kind of support helps you"
          {...register("supportNotes")}
        />
      </FormField>

      <Controller
        control={control}
        name="faithBasedEncouragement"
        render={({ field }) => (
          <FormField
            label="Faith-based encouragement"
            htmlFor="recovery-faith"
            description="Include faith-based encouragement in coaching, if it helps you."
          >
            <Switch id="recovery-faith" checked={field.value} onCheckedChange={field.onChange} />
          </FormField>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

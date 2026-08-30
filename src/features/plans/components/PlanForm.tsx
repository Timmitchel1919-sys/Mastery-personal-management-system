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
  Textarea,
} from "@/components/ui";
import { PillarSelect } from "@/components/shared";
import { normalizeError } from "@/lib/errors";
import {
  PLAN_STATUS_LABEL,
  PLAN_STATUSES,
  planFormSchema,
  type PlanFormValues,
  type PlanHorizon,
} from "../schema";

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export interface PlanFormProps {
  horizon: PlanHorizon;
  defaultValues?: Partial<PlanFormValues>;
  submitLabel: string;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
}

export function PlanForm({
  horizon,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: PlanFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      horizon,
      title: defaultValues?.title ?? "",
      objective: defaultValues?.objective ?? "",
      desiredOutcomes: defaultValues?.desiredOutcomes ?? [],
      keyMeasures: defaultValues?.keyMeasures ?? [],
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      planStatus: defaultValues?.planStatus ?? "planned",
      progress: defaultValues?.progress ?? 0,
      reviewNotes: defaultValues?.reviewNotes ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
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

      <input type="hidden" {...register("horizon")} />

      <FormField label="Title" error={errors.title?.message}>
        <Input placeholder="A short name for this plan" {...register("title")} />
      </FormField>

      <FormField label="Objective" error={errors.objective?.message}>
        <Textarea
          rows={3}
          placeholder="What this plan is meant to achieve…"
          {...register("objective")}
        />
      </FormField>

      <Controller
        control={control}
        name="desiredOutcomes"
        render={({ field }) => (
          <FormField
            label="Desired outcomes"
            htmlFor="plan-outcomes"
            error={errors.desiredOutcomes?.message}
          >
            <Textarea
              id="plan-outcomes"
              rows={3}
              placeholder="One per line"
              value={field.value.join("\n")}
              onChange={(event) => field.onChange(linesToArray(event.target.value))}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="keyMeasures"
        render={({ field }) => (
          <FormField
            label="Key measures"
            htmlFor="plan-measures"
            error={errors.keyMeasures?.message}
          >
            <Textarea
              id="plan-measures"
              rows={3}
              placeholder="One per line"
              value={field.value.join("\n")}
              onChange={(event) => field.onChange(linesToArray(event.target.value))}
            />
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="End date" error={errors.endDate?.message}>
          <Input type="date" {...register("endDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="planStatus"
          render={({ field }) => (
            <FormField label="Status" htmlFor="plan-status" error={errors.planStatus?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="plan-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PLAN_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <FormField label="Progress (%)" error={errors.progress?.message}>
          <Input
            type="number"
            min={0}
            max={100}
            step={5}
            {...register("progress", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField label="Review notes" error={errors.reviewNotes?.message}>
        <Textarea rows={2} placeholder="Optional" {...register("reviewNotes")} />
      </FormField>

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField label="Life pillars" htmlFor="plan-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="plan-pillars" value={field.value ?? []} onChange={field.onChange} />
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

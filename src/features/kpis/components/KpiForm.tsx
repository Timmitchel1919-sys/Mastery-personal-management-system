"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PillarSelect } from "@/components/shared";
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
import type { GoalOption } from "@/features/goals";
import { normalizeError } from "@/lib/errors";
import {
  KPI_DIRECTIONS,
  KPI_DIRECTION_LABEL,
  KPI_WEIGHT_MAX,
  KPI_WEIGHT_MIN,
  kpiFormSchema,
  type KpiFormValues,
} from "../schema";

const NONE = "__none__";
const WEIGHTS = Array.from(
  { length: KPI_WEIGHT_MAX - KPI_WEIGHT_MIN + 1 },
  (_, i) => KPI_WEIGHT_MIN + i,
);
const numberOrNull = {
  setValueAs: (raw: unknown) => (raw === "" || raw == null ? null : Number(raw)),
};

export interface KpiFormProps {
  goalOptions: GoalOption[];
  defaultValues?: Partial<KpiFormValues>;
  submitLabel: string;
  onSubmit: (values: KpiFormValues) => Promise<void>;
  onCancel: () => void;
}

export function KpiForm({
  goalOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: KpiFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KpiFormValues>({
    resolver: zodResolver(kpiFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      unit: defaultValues?.unit ?? "",
      direction: defaultValues?.direction ?? "higher-is-better",
      targetValue: defaultValues?.targetValue ?? null,
      weight: defaultValues?.weight ?? 3,
      goalId: defaultValues?.goalId ?? "",
      notes: defaultValues?.notes ?? "",
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

      <FormField label="Title" error={errors.title?.message}>
        <Input placeholder="e.g. Sleep hours" {...register("title")} />
      </FormField>

      <FormField label="Description" optional error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional detail" {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" optional error={errors.category?.message}>
          <Input placeholder="e.g. Health, Finances" {...register("category")} />
        </FormField>
        <FormField label="Unit" optional error={errors.unit?.message}>
          <Input placeholder="e.g. hours, $, %" {...register("unit")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="direction"
          render={({ field }) => (
            <FormField label="Direction" htmlFor="kpi-direction" error={errors.direction?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="kpi-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_DIRECTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {KPI_DIRECTION_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <FormField label="Target" optional error={errors.targetValue?.message}>
          <Input type="number" step="any" {...register("targetValue", numberOrNull)} />
        </FormField>
      </div>

      <Controller
        control={control}
        name="weight"
        render={({ field }) => (
          <FormField
            label="Weight in Life Score (1–5)"
            htmlFor="kpi-weight"
            description="Higher weight = more influence on your Life Score."
            error={errors.weight?.message}
          >
            <Select
              value={String(field.value)}
              onValueChange={(next) => field.onChange(Number(next))}
            >
              <SelectTrigger id="kpi-weight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEIGHTS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="kpi-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="kpi-goal">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {goalOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField label="Life pillars" htmlFor="kpi-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="kpi-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <FormField label="Notes" optional error={errors.notes?.message}>
        <Textarea rows={2} placeholder="Anything else" {...register("notes")} />
      </FormField>

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

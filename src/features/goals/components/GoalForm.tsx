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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { PillarSelect } from "@/components/shared";
import { PLAN_HORIZON_META, type PlanOption } from "@/features/plans";
import { MEASUREMENT_TYPES, PRIORITIES } from "@/lib/validation/domain";
import { normalizeError } from "@/lib/errors";
import {
  GOAL_STATUS_LABEL,
  GOAL_STATUSES,
  PRIORITY_LABEL,
  REVIEW_FREQUENCIES,
  REVIEW_FREQUENCY_LABEL,
  goalFormSchema,
  type GoalFormValues,
} from "../schema";

const MEASUREMENT_LABEL: Record<(typeof MEASUREMENT_TYPES)[number], string> = {
  binary: "Done / not done",
  count: "Count",
  duration: "Duration",
  currency: "Currency",
  percent: "Percent",
};

const numberOrNull = {
  setValueAs: (raw: unknown) => (raw === "" || raw == null ? null : Number(raw)),
};

// Radix Select items cannot use an empty-string value.
const NO_PLAN = "__none__";

export interface GoalFormProps {
  planOptions: PlanOption[];
  defaultValues?: Partial<GoalFormValues>;
  submitLabel: string;
  onSubmit: (values: GoalFormValues) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({
  planOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      parentPlanId: defaultValues?.parentPlanId ?? "",
      startDate: defaultValues?.startDate ?? "",
      targetDate: defaultValues?.targetDate ?? "",
      goalStatus: defaultValues?.goalStatus ?? "not-started",
      priority: defaultValues?.priority ?? "medium",
      progress: defaultValues?.progress ?? 0,
      measurementType: defaultValues?.measurementType ?? "binary",
      targetValue: defaultValues?.targetValue ?? null,
      currentValue: defaultValues?.currentValue ?? null,
      unit: defaultValues?.unit ?? "",
      reviewFrequency: defaultValues?.reviewFrequency ?? "none",
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

  const grouped = groupPlanOptions(planOptions);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Title" error={errors.title?.message}>
        <Input placeholder="A short name for this goal" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea
          rows={3}
          placeholder="What does success look like?"
          {...register("description")}
        />
      </FormField>

      <Controller
        control={control}
        name="parentPlanId"
        render={({ field }) => (
          <FormField label="Parent plan" htmlFor="goal-plan" error={errors.parentPlanId?.message}>
            <Select
              value={field.value || NO_PLAN}
              onValueChange={(next) => field.onChange(next === NO_PLAN ? "" : next)}
            >
              <SelectTrigger id="goal-plan">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PLAN}>None</SelectItem>
                {grouped.map((group) => (
                  <SelectGroup key={group.horizon}>
                    <SelectLabel>{PLAN_HORIZON_META[group.horizon].label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
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
          <FormField label="Life pillars" htmlFor="goal-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="goal-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="Target date" error={errors.targetDate?.message}>
          <Input type="date" {...register("targetDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={control}
          name="goalStatus"
          render={({ field }) => (
            <FormField label="Status" htmlFor="goal-status" error={errors.goalStatus?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="goal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {GOAL_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <FormField label="Priority" htmlFor="goal-priority" error={errors.priority?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="goal-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABEL[priority]}
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

      <div className="grid gap-4 sm:grid-cols-4">
        <Controller
          control={control}
          name="measurementType"
          render={({ field }) => (
            <FormField
              label="Measure"
              htmlFor="goal-measure"
              error={errors.measurementType?.message}
              className="sm:col-span-1"
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="goal-measure">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {MEASUREMENT_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <FormField label="Current" error={errors.currentValue?.message}>
          <Input type="number" step="any" {...register("currentValue", numberOrNull)} />
        </FormField>
        <FormField label="Target" error={errors.targetValue?.message}>
          <Input type="number" step="any" {...register("targetValue", numberOrNull)} />
        </FormField>
        <FormField label="Unit" error={errors.unit?.message}>
          <Input placeholder="km, €, books…" {...register("unit")} />
        </FormField>
      </div>

      <Controller
        control={control}
        name="reviewFrequency"
        render={({ field }) => (
          <FormField
            label="Review frequency"
            htmlFor="goal-review"
            error={errors.reviewFrequency?.message}
          >
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="goal-review">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVIEW_FREQUENCIES.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {REVIEW_FREQUENCY_LABEL[frequency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea rows={2} placeholder="Optional" {...register("notes")} />
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

function groupPlanOptions(options: PlanOption[]) {
  const order: PlanOption["horizon"][] = ["five-year", "one-year", "quarter", "month", "week"];
  return order
    .map((horizon) => ({
      horizon,
      options: options.filter((option) => option.horizon === horizon),
    }))
    .filter((group) => group.options.length > 0);
}

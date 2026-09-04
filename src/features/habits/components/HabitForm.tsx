"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  HABIT_FREQUENCY_LABEL,
  HABIT_FREQUENCIES,
  HABIT_STATUS_LABEL,
  HABIT_STATUSES,
  habitFormSchema,
  type HabitFormValues,
} from "../schema";

const NONE = "__none__";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface HabitFormProps {
  goalOptions: GoalOption[];
  defaultValues?: Partial<HabitFormValues>;
  submitLabel: string;
  onSubmit: (values: HabitFormValues) => Promise<void>;
  onCancel: () => void;
}

export function HabitForm({
  goalOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: HabitFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
      frequency: defaultValues?.frequency ?? "daily",
      interval: defaultValues?.interval ?? 1,
      weekdays: defaultValues?.weekdays ?? [],
      daysOfMonthText: defaultValues?.daysOfMonthText ?? "",
      target: defaultValues?.target ?? 1,
      unit: defaultValues?.unit ?? "",
      reminderTime: defaultValues?.reminderTime ?? "",
      habitStatus: defaultValues?.habitStatus ?? "active",
    },
  });

  const frequency = useWatch({ control, name: "frequency" });

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
        <Input placeholder="e.g. Morning prayer, Run 5k" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional detail" {...register("description")} />
      </FormField>

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField label="Life pillars" htmlFor="habit-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="habit-pillars" value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="habit-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="habit-goal">
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
        name="frequency"
        render={({ field }) => (
          <FormField label="Frequency" htmlFor="habit-frequency" error={errors.frequency?.message}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="habit-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HABIT_FREQUENCIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {HABIT_FREQUENCY_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      {frequency === "daily" ? (
        <FormField label="Every N days" error={errors.interval?.message}>
          <Input
            type="number"
            min={1}
            max={365}
            {...register("interval", { valueAsNumber: true })}
          />
        </FormField>
      ) : null}

      {frequency === "weekly" ? (
        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <FormField
              label="On days"
              error={errors.weekdays?.message}
              description="Leave all off to count every day."
            >
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((label, index) => {
                  const active = field.value.includes(index);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        field.onChange(
                          active
                            ? field.value.filter((day: number) => day !== index)
                            : [...field.value, index],
                        )
                      }
                      className={`h-8 w-10 rounded-md border text-xs font-medium ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          )}
        />
      ) : null}

      {frequency === "monthly" ? (
        <FormField label="Days of month" error={errors.daysOfMonthText?.message}>
          <Input placeholder="e.g. 1, 15" {...register("daysOfMonthText")} />
        </FormField>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Target" error={errors.target?.message}>
          <Input
            type="number"
            min={0}
            step="any"
            {...register("target", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Unit" error={errors.unit?.message}>
          <Input placeholder="e.g. times, pages, minutes" {...register("unit")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Reminder time" error={errors.reminderTime?.message}>
          <Input type="time" {...register("reminderTime")} />
        </FormField>
        <Controller
          control={control}
          name="habitStatus"
          render={({ field }) => (
            <FormField label="Status" htmlFor="habit-status" error={errors.habitStatus?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="habit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {HABIT_STATUS_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

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

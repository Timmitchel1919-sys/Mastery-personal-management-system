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
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import {
  DEEP_WORK_STATUS_LABEL,
  DEEP_WORK_STATUSES,
  RATING_MAX,
  RATING_MIN,
  deepWorkFormSchema,
  type DeepWorkFormValues,
} from "../schema";

const NONE = "__none__";
const RATINGS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i);

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export interface DeepWorkFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<DeepWorkFormValues>;
  submitLabel: string;
  onSubmit: (values: DeepWorkFormValues) => Promise<void>;
  onCancel: () => void;
}

export function DeepWorkForm({
  goalOptions,
  projectOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: DeepWorkFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeepWorkFormValues>({
    resolver: zodResolver(deepWorkFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      intendedOutcome: defaultValues?.intendedOutcome ?? "",
      goalId: defaultValues?.goalId ?? "",
      projectId: defaultValues?.projectId ?? "",
      plannedMinutes: defaultValues?.plannedMinutes ?? 90,
      startedAt: defaultValues?.startedAt ?? "",
      endedAt: defaultValues?.endedAt ?? "",
      actualMinutes: defaultValues?.actualMinutes ?? 0,
      energyLevel: defaultValues?.energyLevel ?? 3,
      focusQuality: defaultValues?.focusQuality ?? 3,
      distractions: defaultValues?.distractions ?? [],
      completionNotes: defaultValues?.completionNotes ?? "",
      sessionStatus: defaultValues?.sessionStatus ?? "planned",
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
        <Input placeholder="A short name for this session" {...register("title")} />
      </FormField>

      <FormField label="Intended outcome" error={errors.intendedOutcome?.message}>
        <Textarea
          rows={2}
          placeholder="What will be done by the end of this block?"
          {...register("intendedOutcome")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="goalId"
          render={({ field }) => (
            <FormField label="Goal" htmlFor="dw-goal" error={errors.goalId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="dw-goal">
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
          name="projectId"
          render={({ field }) => (
            <FormField label="Project" htmlFor="dw-project" error={errors.projectId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="dw-project">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {projectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Planned (min)" error={errors.plannedMinutes?.message}>
          <Input
            type="number"
            min={1}
            max={600}
            {...register("plannedMinutes", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Actual (min)" error={errors.actualMinutes?.message}>
          <Input
            type="number"
            min={0}
            max={600}
            {...register("actualMinutes", { valueAsNumber: true })}
          />
        </FormField>
        <Controller
          control={control}
          name="sessionStatus"
          render={({ field }) => (
            <FormField label="Status" htmlFor="dw-status" error={errors.sessionStatus?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="dw-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEEP_WORK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {DEEP_WORK_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start" error={errors.startedAt?.message}>
          <Input type="datetime-local" {...register("startedAt")} />
        </FormField>
        <FormField label="End" error={errors.endedAt?.message}>
          <Input type="datetime-local" {...register("endedAt")} />
        </FormField>
      </div>
      <p className="text-subtle -mt-2 text-xs">
        Leave “Actual (min)” at 0 to fill it from the start and end time.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="energyLevel"
          render={({ field }) => (
            <FormField label="Energy (1–5)" htmlFor="dw-energy" error={errors.energyLevel?.message}>
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="dw-energy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATINGS.map((rating) => (
                    <SelectItem key={rating} value={String(rating)}>
                      {rating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="focusQuality"
          render={({ field }) => (
            <FormField
              label="Focus quality (1–5)"
              htmlFor="dw-quality"
              error={errors.focusQuality?.message}
            >
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="dw-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATINGS.map((rating) => (
                    <SelectItem key={rating} value={String(rating)}>
                      {rating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <Controller
        control={control}
        name="distractions"
        render={({ field }) => (
          <FormField
            label="Distraction log"
            htmlFor="dw-distractions"
            error={errors.distractions?.message}
          >
            <Textarea
              id="dw-distractions"
              rows={3}
              placeholder="One distraction per line"
              value={field.value.join("\n")}
              onChange={(event) => field.onChange(linesToArray(event.target.value))}
            />
          </FormField>
        )}
      />

      <FormField label="Completion notes" error={errors.completionNotes?.message}>
        <Textarea rows={2} placeholder="How did it go?" {...register("completionNotes")} />
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

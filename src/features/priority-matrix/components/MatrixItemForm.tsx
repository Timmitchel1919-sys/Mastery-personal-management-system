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
  Switch,
  Textarea,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import {
  MATRIX_QUADRANT_META,
  MATRIX_QUADRANTS,
  matrixItemFormSchema,
  type MatrixItemFormValues,
} from "../schema";

const NONE = "__none__";

export interface MatrixItemFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<MatrixItemFormValues>;
  submitLabel: string;
  onSubmit: (values: MatrixItemFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MatrixItemForm({
  goalOptions,
  projectOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: MatrixItemFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MatrixItemFormValues>({
    resolver: zodResolver(matrixItemFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      quadrant: defaultValues?.quadrant ?? "do",
      note: defaultValues?.note ?? "",
      goalId: defaultValues?.goalId ?? "",
      projectId: defaultValues?.projectId ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      completed: defaultValues?.completed ?? false,
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
        <Input placeholder="What needs deciding?" {...register("title")} />
      </FormField>

      <Controller
        control={control}
        name="quadrant"
        render={({ field }) => (
          <FormField label="Quadrant" htmlFor="pm-quadrant" error={errors.quadrant?.message}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="pm-quadrant">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATRIX_QUADRANTS.map((quadrant) => (
                  <SelectItem key={quadrant} value={quadrant}>
                    {MATRIX_QUADRANT_META[quadrant].label} —{" "}
                    {MATRIX_QUADRANT_META[quadrant].summary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="goalId"
          render={({ field }) => (
            <FormField label="Goal" htmlFor="pm-goal" error={errors.goalId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="pm-goal">
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
            <FormField label="Project" htmlFor="pm-project" error={errors.projectId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="pm-project">
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

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField label="Life pillars" htmlFor="pm-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="pm-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <FormField label="Note" error={errors.note?.message}>
        <Textarea rows={2} placeholder="Optional context" {...register("note")} />
      </FormField>

      <Controller
        control={control}
        name="completed"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={field.value} onCheckedChange={field.onChange} />
            Completed
          </label>
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

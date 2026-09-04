"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { PillarSelect } from "@/components/shared";
import {
  Alert,
  AlertDescription,
  Button,
  FormField,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui";
import type { HabitOption } from "@/features/habits";
import { normalizeError } from "@/lib/errors";
import {
  MAX_ROUTINE_STEPS,
  ROUTINE_TYPES,
  ROUTINE_TYPE_LABEL,
  emptyRoutineStep,
  routineFormSchema,
  type RoutineFormValues,
} from "../schema";

const NONE = "__none__";

export interface RoutineFormProps {
  habitOptions: HabitOption[];
  defaultValues?: Partial<RoutineFormValues>;
  submitLabel: string;
  onSubmit: (values: RoutineFormValues) => Promise<void>;
  onCancel: () => void;
}

export function RoutineForm({
  habitOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: RoutineFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      routineType: defaultValues?.routineType ?? "morning",
      pillarIds: defaultValues?.pillarIds ?? [],
      isTemplate: defaultValues?.isTemplate ?? false,
      steps: defaultValues?.steps ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "steps" });

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
        <Input placeholder="e.g. Morning routine" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional detail" {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="routineType"
          render={({ field }) => (
            <FormField label="Type" htmlFor="routine-type" error={errors.routineType?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="routine-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTINE_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ROUTINE_TYPE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="isTemplate"
          render={({ field }) => (
            <FormField label="Reusable template" htmlFor="routine-template">
              <div className="flex h-9 items-center">
                <Switch
                  id="routine-template"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            </FormField>
          )}
        />
      </div>

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField
            label="Life pillars"
            htmlFor="routine-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect
              id="routine-pillars"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <fieldset className="border-border rounded-lg border p-3">
        <legend className="text-subtle px-1 text-xs font-medium">Steps</legend>
        <div className="flex flex-col gap-3">
          {fields.length === 0 ? (
            <p className="text-subtle text-sm">No steps yet. Add the first thing you do.</p>
          ) : null}
          {fields.map((step, index) => (
            <div key={step.id} className="border-border rounded-md border p-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <FormField
                    label={`Step ${index + 1}`}
                    error={errors.steps?.[index]?.title?.message}
                  >
                    <Input
                      placeholder="What do you do?"
                      {...register(`steps.${index}.title` as const)}
                    />
                  </FormField>
                </div>
                <IconButton
                  size="sm"
                  aria-label={`Remove step ${index + 1}`}
                  icon={<Trash2 />}
                  onClick={() => remove(index)}
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <FormField label="Minutes" error={errors.steps?.[index]?.estimatedMinutes?.message}>
                  <Input
                    type="number"
                    min={0}
                    max={600}
                    {...register(`steps.${index}.estimatedMinutes` as const, {
                      valueAsNumber: true,
                    })}
                  />
                </FormField>
                <Controller
                  control={control}
                  name={`steps.${index}.habitId` as const}
                  render={({ field }) => (
                    <FormField label="Linked habit">
                      <Select
                        value={field.value || NONE}
                        onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          {habitOptions.map((option) => (
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
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={fields.length >= MAX_ROUTINE_STEPS}
            onClick={() => append(emptyRoutineStep())}
          >
            <Plus />
            Add step
          </Button>
        </div>
      </fieldset>

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

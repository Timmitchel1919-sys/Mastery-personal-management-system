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
import { resolveBrowserZone } from "@/features/calendar";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import {
  TIME_BLOCK_CATEGORIES,
  TIME_BLOCK_CATEGORY_LABEL,
  TIME_BLOCK_STATUS_LABEL,
  TIME_BLOCK_STATUSES,
  timeBlockFormSchema,
  type TimeBlockFormValues,
} from "../schema";

const NONE = "__none__";

export interface TimeBlockFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<TimeBlockFormValues>;
  submitLabel: string;
  onSubmit: (values: TimeBlockFormValues) => Promise<void>;
  onCancel: () => void;
}

export function TimeBlockForm({
  goalOptions,
  projectOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TimeBlockFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TimeBlockFormValues>({
    resolver: zodResolver(timeBlockFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      category: defaultValues?.category ?? "deep-work",
      timeZone: defaultValues?.timeZone ?? resolveBrowserZone(),
      startWall: defaultValues?.startWall ?? "",
      endWall: defaultValues?.endWall ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
      projectId: defaultValues?.projectId ?? "",
      notes: defaultValues?.notes ?? "",
      blockStatus: defaultValues?.blockStatus ?? "planned",
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
        <Input placeholder="What is this block for?" {...register("title")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <FormField label="Category" htmlFor="tb-category" error={errors.category?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tb-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_BLOCK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {TIME_BLOCK_CATEGORY_LABEL[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="blockStatus"
          render={({ field }) => (
            <FormField label="Status" htmlFor="tb-status" error={errors.blockStatus?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tb-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_BLOCK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TIME_BLOCK_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start" error={errors.startWall?.message}>
          <Input type="datetime-local" {...register("startWall")} />
        </FormField>
        <FormField label="End" error={errors.endWall?.message}>
          <Input type="datetime-local" {...register("endWall")} />
        </FormField>
      </div>

      <FormField label="Time zone" htmlFor="tb-tz" error={errors.timeZone?.message}>
        <Input id="tb-tz" placeholder="e.g. Europe/Amsterdam" {...register("timeZone")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="goalId"
          render={({ field }) => (
            <FormField label="Goal" htmlFor="tb-goal" error={errors.goalId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="tb-goal">
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
            <FormField label="Project" htmlFor="tb-project" error={errors.projectId?.message}>
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="tb-project">
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
          <FormField label="Life pillars" htmlFor="tb-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="tb-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea
          rows={2}
          placeholder="Anything to remember about this block"
          {...register("notes")}
        />
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

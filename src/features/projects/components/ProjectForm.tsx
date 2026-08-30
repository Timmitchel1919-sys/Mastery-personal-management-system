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
import { PRIORITY_LABEL, type GoalOption } from "@/features/goals";
import { PRIORITIES } from "@/lib/validation/domain";
import { normalizeError } from "@/lib/errors";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_STATUSES,
  projectFormSchema,
  type ProjectFormValues,
} from "../schema";

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

// Radix Select items cannot use an empty-string value.
const NO_GOAL = "__none__";

export interface ProjectFormProps {
  goalOptions: GoalOption[];
  defaultValues?: Partial<ProjectFormValues>;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({
  goalOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      expectedOutcome: defaultValues?.expectedOutcome ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
      owner: defaultValues?.owner ?? "",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      projectStatus: defaultValues?.projectStatus ?? "planned",
      priority: defaultValues?.priority ?? "medium",
      progress: defaultValues?.progress ?? 0,
      dependencies: defaultValues?.dependencies ?? [],
      risks: defaultValues?.risks ?? [],
      reviewNotes: defaultValues?.reviewNotes ?? "",
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
        <Input placeholder="A short name for this project" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={3} placeholder="What is this project?" {...register("description")} />
      </FormField>

      <FormField label="Expected outcome" error={errors.expectedOutcome?.message}>
        <Textarea
          rows={2}
          placeholder="What will be true when it's done?"
          {...register("expectedOutcome")}
        />
      </FormField>

      <Controller
        control={control}
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="project-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NO_GOAL}
              onValueChange={(next) => field.onChange(next === NO_GOAL ? "" : next)}
            >
              <SelectTrigger id="project-goal">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GOAL}>None</SelectItem>
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
          <FormField
            label="Life pillars"
            htmlFor="project-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect
              id="project-pillars"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Owner" error={errors.owner?.message}>
          <Input placeholder="Who's responsible?" {...register("owner")} />
        </FormField>
        <FormField label="Start date" error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="End date" error={errors.endDate?.message}>
          <Input type="date" {...register("endDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={control}
          name="projectStatus"
          render={({ field }) => (
            <FormField
              label="Status"
              htmlFor="project-status"
              error={errors.projectStatus?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_STATUS_LABEL[status]}
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
            <FormField label="Priority" htmlFor="project-priority" error={errors.priority?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="project-priority">
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

      <Controller
        control={control}
        name="dependencies"
        render={({ field }) => (
          <FormField
            label="Dependencies"
            htmlFor="project-dependencies"
            error={errors.dependencies?.message}
          >
            <Textarea
              id="project-dependencies"
              rows={2}
              placeholder="One per line"
              value={field.value.join("\n")}
              onChange={(event) => field.onChange(linesToArray(event.target.value))}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="risks"
        render={({ field }) => (
          <FormField label="Risks" htmlFor="project-risks" error={errors.risks?.message}>
            <Textarea
              id="project-risks"
              rows={2}
              placeholder="One per line"
              value={field.value.join("\n")}
              onChange={(event) => field.onChange(linesToArray(event.target.value))}
            />
          </FormField>
        )}
      />

      <FormField label="Review notes" error={errors.reviewNotes?.message}>
        <Textarea rows={2} placeholder="Optional" {...register("reviewNotes")} />
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

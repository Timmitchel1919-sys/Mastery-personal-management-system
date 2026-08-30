"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import {
  MILESTONE_PARENT_TYPE_LABEL,
  MILESTONE_PARENT_TYPES,
  MILESTONE_STATUS_LABEL,
  MILESTONE_STATUSES,
  milestoneFormSchema,
  type MilestoneFormValues,
} from "../schema";

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export interface MilestoneFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<MilestoneFormValues>;
  submitLabel: string;
  onSubmit: (values: MilestoneFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MilestoneForm({
  goalOptions,
  projectOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: MilestoneFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      parentType: defaultValues?.parentType ?? "none",
      parentId: defaultValues?.parentId ?? "",
      dueDate: defaultValues?.dueDate ?? "",
      milestoneStatus: defaultValues?.milestoneStatus ?? "upcoming",
      progress: defaultValues?.progress ?? 0,
      dependencies: defaultValues?.dependencies ?? [],
      evidence: defaultValues?.evidence ?? "",
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

  const parentType = useWatch({ control, name: "parentType" });
  const parentOptions = parentType === "project" ? projectOptions : goalOptions;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Title" error={errors.title?.message}>
        <Input placeholder="A short name for this milestone" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={3} placeholder="What has to be true here?" {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="parentType"
          render={({ field }) => (
            <FormField
              label="Belongs to"
              htmlFor="milestone-parent-type"
              error={errors.parentType?.message}
            >
              <Select
                value={field.value}
                onValueChange={(next) => {
                  field.onChange(next);
                  setValue("parentId", "", { shouldValidate: true });
                }}
              >
                <SelectTrigger id="milestone-parent-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_PARENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {MILESTONE_PARENT_TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />

        {parentType !== "none" ? (
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <FormField
                label={parentType === "project" ? "Project" : "Goal"}
                htmlFor="milestone-parent"
                error={errors.parentId?.message}
              >
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="milestone-parent">
                    <SelectValue placeholder={`Pick a ${parentType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />
        ) : null}
      </div>

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField
            label="Life pillars"
            htmlFor="milestone-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect
              id="milestone-pillars"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Due date" error={errors.dueDate?.message}>
          <Input type="date" {...register("dueDate")} />
        </FormField>
        <Controller
          control={control}
          name="milestoneStatus"
          render={({ field }) => (
            <FormField
              label="Status"
              htmlFor="milestone-status"
              error={errors.milestoneStatus?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="milestone-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {MILESTONE_STATUS_LABEL[status]}
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
            htmlFor="milestone-dependencies"
            error={errors.dependencies?.message}
          >
            <Textarea
              id="milestone-dependencies"
              rows={2}
              placeholder="One per line"
              value={field.value.join("\n")}
              onChange={(event) => field.onChange(linesToArray(event.target.value))}
            />
          </FormField>
        )}
      />

      <FormField label="Evidence / notes" error={errors.evidence?.message}>
        <Textarea
          rows={2}
          placeholder="Link or describe the proof this is done"
          {...register("evidence")}
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

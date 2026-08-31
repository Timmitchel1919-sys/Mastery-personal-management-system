"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
  Textarea,
} from "@/components/ui";
import { PillarSelect } from "@/components/shared";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import {
  MAX_ROADMAP_PHASES,
  PHASE_STATUS_LABEL,
  PHASE_STATUSES,
  ROADMAP_KIND_LABEL,
  ROADMAP_KINDS,
  ROADMAP_STATUS_LABEL,
  ROADMAP_STATUSES,
  roadmapFormSchema,
  type RoadmapFormValues,
} from "../schema";

// Radix Select items cannot use an empty-string value.
const NONE = "__none__";

const EMPTY_PHASE = {
  name: "",
  startDate: "",
  endDate: "",
  phaseStatus: "upcoming" as const,
};

export interface RoadmapFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<RoadmapFormValues>;
  submitLabel: string;
  onSubmit: (values: RoadmapFormValues) => Promise<void>;
  onCancel: () => void;
}

export function RoadmapForm({
  goalOptions,
  projectOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: RoadmapFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoadmapFormValues>({
    resolver: zodResolver(roadmapFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      roadmapKind: defaultValues?.roadmapKind ?? "goal",
      linkedGoalId: defaultValues?.linkedGoalId ?? "",
      linkedProjectId: defaultValues?.linkedProjectId ?? "",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      roadmapStatus: defaultValues?.roadmapStatus ?? "planning",
      progress: defaultValues?.progress ?? 0,
      phases: defaultValues?.phases ?? [],
      notes: defaultValues?.notes ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "phases" });

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
        <Input placeholder="A short name for this roadmap" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea
          rows={3}
          placeholder="What does this roadmap cover?"
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="roadmapKind"
          render={({ field }) => (
            <FormField label="Kind" htmlFor="roadmap-kind" error={errors.roadmapKind?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="roadmap-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAP_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {ROADMAP_KIND_LABEL[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="roadmapStatus"
          render={({ field }) => (
            <FormField
              label="Status"
              htmlFor="roadmap-status"
              error={errors.roadmapStatus?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="roadmap-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAP_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ROADMAP_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="linkedGoalId"
          render={({ field }) => (
            <FormField
              label="Linked goal"
              htmlFor="roadmap-goal"
              error={errors.linkedGoalId?.message}
            >
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="roadmap-goal">
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
          name="linkedProjectId"
          render={({ field }) => (
            <FormField
              label="Linked project"
              htmlFor="roadmap-project"
              error={errors.linkedProjectId?.message}
            >
              <Select
                value={field.value || NONE}
                onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
              >
                <SelectTrigger id="roadmap-project">
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
          <FormField
            label="Life pillars"
            htmlFor="roadmap-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect
              id="roadmap-pillars"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Start date" error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="End date" error={errors.endDate?.message}>
          <Input type="date" {...register("endDate")} />
        </FormField>
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

      <fieldset className="border-border rounded-lg border p-3">
        <legend className="text-subtle px-1 text-xs font-medium">Phases</legend>
        <div className="flex flex-col gap-3">
          {fields.length === 0 ? (
            <p className="text-subtle text-sm">
              No phases yet. Add the first stage of the timeline.
            </p>
          ) : null}
          {fields.map((phase, index) => (
            <div key={phase.id} className="border-border rounded-md border p-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <FormField
                    label={`Phase ${index + 1}`}
                    error={errors.phases?.[index]?.name?.message}
                  >
                    <Input
                      placeholder="Phase name"
                      {...register(`phases.${index}.name` as const)}
                    />
                  </FormField>
                </div>
                <IconButton
                  size="sm"
                  aria-label={`Remove phase ${index + 1}`}
                  icon={<Trash2 />}
                  onClick={() => remove(index)}
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <FormField label="Start" error={errors.phases?.[index]?.startDate?.message}>
                  <Input type="date" {...register(`phases.${index}.startDate` as const)} />
                </FormField>
                <FormField label="End" error={errors.phases?.[index]?.endDate?.message}>
                  <Input type="date" {...register(`phases.${index}.endDate` as const)} />
                </FormField>
                <Controller
                  control={control}
                  name={`phases.${index}.phaseStatus` as const}
                  render={({ field }) => (
                    <FormField label="Status" error={errors.phases?.[index]?.phaseStatus?.message}>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {PHASE_STATUS_LABEL[status]}
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
            className="self-start"
            disabled={fields.length >= MAX_ROADMAP_PHASES}
            onClick={() => append({ ...EMPTY_PHASE })}
          >
            <Plus />
            Add phase
          </Button>
        </div>
      </fieldset>

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

"use client";

import { useState } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";
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
import { PRIORITY_LABEL } from "@/features/goals";
import type { GoalOption } from "@/features/goals";
import type { MilestoneOption } from "@/features/milestones";
import type { ProjectOption } from "@/features/projects";
import { normalizeError } from "@/lib/errors";
import { PRIORITIES } from "@/lib/validation/domain";
import {
  TASK_ENERGY_LEVELS,
  TASK_RECURRENCE_FREQUENCY_LABEL,
  TASK_RECURRENCE_OPTIONS,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
  taskFormSchema,
  type TaskFormValues,
} from "../schema";
import type { TaskOption } from "../task-repository";

const NONE = "__none__";
const ENERGY_LABEL: Record<(typeof TASK_ENERGY_LEVELS)[number], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function tagsToText(tags: string[]): string {
  return tags.join(", ");
}
function textToTags(text: string): string[] {
  return text
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export interface TaskFormProps {
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  milestoneOptions: MilestoneOption[];
  taskOptions: TaskOption[];
  defaultValues?: Partial<TaskFormValues>;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel: () => void;
}

function LinkSelect({
  control,
  name,
  label,
  id,
  options,
  errorMessage,
}: {
  control: Control<TaskFormValues>;
  name: "goalId" | "projectId" | "milestoneId" | "parentTaskId";
  label: string;
  id: string;
  options: { id: string; title: string }[];
  errorMessage?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField label={label} htmlFor={id} error={errorMessage}>
          <Select
            value={field.value || NONE}
            onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
    />
  );
}

export function TaskForm({
  goalOptions,
  projectOptions,
  milestoneOptions,
  taskOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      taskStatus: defaultValues?.taskStatus ?? "todo",
      priority: defaultValues?.priority ?? "medium",
      startDate: defaultValues?.startDate ?? "",
      dueDate: defaultValues?.dueDate ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
      projectId: defaultValues?.projectId ?? "",
      milestoneId: defaultValues?.milestoneId ?? "",
      parentTaskId: defaultValues?.parentTaskId ?? "",
      recurrence: defaultValues?.recurrence ?? "none",
      recurrenceInterval: defaultValues?.recurrenceInterval ?? 1,
      estimatedMinutes: defaultValues?.estimatedMinutes ?? 0,
      actualMinutes: defaultValues?.actualMinutes ?? 0,
      energyRequirement: defaultValues?.energyRequirement ?? "medium",
      context: defaultValues?.context ?? "",
      tags: defaultValues?.tags ?? [],
      notes: defaultValues?.notes ?? "",
      resolutionReason: defaultValues?.resolutionReason ?? "",
    },
  });

  const status = useWatch({ control, name: "taskStatus" });
  const recurrence = useWatch({ control, name: "recurrence" });
  const showResolution = status === "blocked" || status === "cancelled";

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
        <Input placeholder="What needs doing?" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional detail" {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="taskStatus"
          render={({ field }) => (
            <FormField label="Status" htmlFor="task-status" error={errors.taskStatus?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TASK_STATUS_LABEL[value]}
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
            <FormField label="Priority" htmlFor="task-priority" error={errors.priority?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PRIORITY_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="Due date" error={errors.dueDate?.message}>
          <Input type="date" {...register("dueDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LinkSelect
          control={control}
          name="goalId"
          label="Goal"
          id="task-goal"
          options={goalOptions}
          errorMessage={errors.goalId?.message}
        />
        <LinkSelect
          control={control}
          name="projectId"
          label="Project"
          id="task-project"
          options={projectOptions}
          errorMessage={errors.projectId?.message}
        />
        <LinkSelect
          control={control}
          name="milestoneId"
          label="Milestone"
          id="task-milestone"
          options={milestoneOptions}
          errorMessage={errors.milestoneId?.message}
        />
        <LinkSelect
          control={control}
          name="parentTaskId"
          label="Parent task"
          id="task-parent"
          options={taskOptions}
          errorMessage={errors.parentTaskId?.message}
        />
      </div>

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField label="Life pillars" htmlFor="task-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="task-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Estimate (min)" error={errors.estimatedMinutes?.message}>
          <Input type="number" min={0} {...register("estimatedMinutes", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Actual (min)" error={errors.actualMinutes?.message}>
          <Input type="number" min={0} {...register("actualMinutes", { valueAsNumber: true })} />
        </FormField>
        <Controller
          control={control}
          name="energyRequirement"
          render={({ field }) => (
            <FormField
              label="Energy"
              htmlFor="task-energy"
              error={errors.energyRequirement?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-energy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_ENERGY_LEVELS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ENERGY_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Context" error={errors.context?.message}>
          <Input placeholder="e.g. @home, @calls" {...register("context")} />
        </FormField>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <FormField label="Tags" htmlFor="task-tags" error={errors.tags?.message}>
              <Input
                id="task-tags"
                placeholder="Comma separated"
                defaultValue={tagsToText(field.value)}
                onChange={(event) => field.onChange(textToTags(event.target.value))}
              />
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="recurrence"
          render={({ field }) => (
            <FormField label="Repeat" htmlFor="task-repeat" error={errors.recurrence?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  {TASK_RECURRENCE_OPTIONS.filter((value) => value !== "none").map((value) => (
                    <SelectItem key={value} value={value}>
                      {TASK_RECURRENCE_FREQUENCY_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        {recurrence !== "none" ? (
          <FormField label="Every (n)" error={errors.recurrenceInterval?.message}>
            <Input
              type="number"
              min={1}
              max={365}
              {...register("recurrenceInterval", { valueAsNumber: true })}
            />
          </FormField>
        ) : null}
      </div>

      {showResolution ? (
        <FormField label="Reason (blocked / cancelled)" error={errors.resolutionReason?.message}>
          <Textarea
            rows={2}
            placeholder="Why is it blocked or cancelled?"
            {...register("resolutionReason")}
          />
        </FormField>
      ) : null}

      <FormField label="Notes" error={errors.notes?.message}>
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

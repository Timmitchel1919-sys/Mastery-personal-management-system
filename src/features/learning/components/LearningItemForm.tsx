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
  Checkbox,
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
import type { GoalOption } from "@/features/goals";
import type { SkillOption } from "@/features/skills";
import { normalizeError } from "@/lib/errors";
import {
  LEARNING_ITEM_TYPES,
  LEARNING_ITEM_TYPE_LABEL,
  LEARNING_STATUSES,
  LEARNING_STATUS_LABEL,
  MAX_LESSONS,
  emptyLesson,
  learningItemFormSchema,
  type LearningItemFormValues,
} from "../schema";

const NONE = "__none__";

export interface LearningItemFormProps {
  goalOptions: GoalOption[];
  skillOptions: SkillOption[];
  defaultValues?: Partial<LearningItemFormValues>;
  submitLabel: string;
  onSubmit: (values: LearningItemFormValues) => Promise<void>;
  onCancel: () => void;
}

export function LearningItemForm({
  goalOptions,
  skillOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: LearningItemFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LearningItemFormValues>({
    resolver: zodResolver(learningItemFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      itemType: defaultValues?.itemType ?? "course",
      learningStatus: defaultValues?.learningStatus ?? "not-started",
      provider: defaultValues?.provider ?? "",
      targetCompletionDate: defaultValues?.targetCompletionDate ?? "",
      resourcesText: defaultValues?.resourcesText ?? "",
      lessons: defaultValues?.lessons ?? [],
      assessmentNotes: defaultValues?.assessmentNotes ?? "",
      notes: defaultValues?.notes ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
      skillId: defaultValues?.skillId ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lessons" });

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
        <Input placeholder="e.g. Advanced TypeScript" {...register("title")} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional detail" {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="itemType"
          render={({ field }) => (
            <FormField label="Type" htmlFor="learning-type" error={errors.itemType?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="learning-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_ITEM_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LEARNING_ITEM_TYPE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="learningStatus"
          render={({ field }) => (
            <FormField
              label="Status"
              htmlFor="learning-status"
              error={errors.learningStatus?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="learning-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LEARNING_STATUS_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Provider" optional error={errors.provider?.message}>
          <Input placeholder="e.g. Coursera, self-study" {...register("provider")} />
        </FormField>
        <FormField label="Target completion" error={errors.targetCompletionDate?.message}>
          <Input type="date" {...register("targetCompletionDate")} />
        </FormField>
      </div>

      <Controller
        control={control}
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="learning-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="learning-goal">
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
        name="skillId"
        render={({ field }) => (
          <FormField label="Skill" htmlFor="learning-skill" error={errors.skillId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="learning-skill">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {skillOptions.map((option) => (
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
            htmlFor="learning-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect
              id="learning-pillars"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <fieldset className="border-border rounded-lg border p-3">
        <legend className="text-subtle px-1 text-xs font-medium">Lessons</legend>
        <div className="flex flex-col gap-2">
          {fields.length === 0 ? <p className="text-subtle text-sm">No lessons yet.</p> : null}
          {fields.map((lesson, index) => (
            <div key={lesson.id} className="flex items-center gap-2">
              <Controller
                control={control}
                name={`lessons.${index}.completed` as const}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Input
                className="flex-1"
                placeholder={`Lesson ${index + 1}`}
                {...register(`lessons.${index}.title` as const)}
              />
              <IconButton
                size="sm"
                aria-label={`Remove lesson ${index + 1}`}
                icon={<Trash2 />}
                onClick={() => remove(index)}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={fields.length >= MAX_LESSONS}
            onClick={() => append(emptyLesson())}
          >
            <Plus />
            Add lesson
          </Button>
        </div>
      </fieldset>

      <FormField
        label="Resources"
        htmlFor="learning-resources"
        description="One per line — links or references."
      >
        <Textarea
          id="learning-resources"
          rows={3}
          placeholder="https://…"
          {...register("resourcesText")}
        />
      </FormField>

      <FormField label="Assessment notes" optional error={errors.assessmentNotes?.message}>
        <Textarea
          rows={2}
          placeholder="Scores, feedback, what to revisit"
          {...register("assessmentNotes")}
        />
      </FormField>

      <FormField label="Notes" optional error={errors.notes?.message}>
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

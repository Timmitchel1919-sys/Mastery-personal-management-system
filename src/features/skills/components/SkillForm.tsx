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
import type { GoalOption } from "@/features/goals";
import { normalizeError } from "@/lib/errors";
import {
  PROFICIENCY_MAX,
  PROFICIENCY_MIN,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABEL,
  skillFormSchema,
  type SkillFormValues,
} from "../schema";

const NONE = "__none__";
const PROFICIENCIES = Array.from(
  { length: PROFICIENCY_MAX - PROFICIENCY_MIN + 1 },
  (_, i) => PROFICIENCY_MIN + i,
);

export interface SkillFormProps {
  goalOptions: GoalOption[];
  defaultValues?: Partial<SkillFormValues>;
  submitLabel: string;
  onSubmit: (values: SkillFormValues) => Promise<void>;
  onCancel: () => void;
}

export function SkillForm({
  goalOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: SkillFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "technical",
      startingProficiency: defaultValues?.startingProficiency ?? 2,
      targetProficiency: defaultValues?.targetProficiency ?? 4,
      practicePlan: defaultValues?.practicePlan ?? "",
      evidenceText: defaultValues?.evidenceText ?? "",
      resourcesText: defaultValues?.resourcesText ?? "",
      goalId: defaultValues?.goalId ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      nextReviewDate: defaultValues?.nextReviewDate ?? "",
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
        <Input placeholder="e.g. Public speaking" {...register("title")} />
      </FormField>

      <FormField label="Description" optional error={errors.description?.message}>
        <Textarea rows={2} placeholder="Optional detail" {...register("description")} />
      </FormField>

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <FormField label="Category" htmlFor="skill-category" error={errors.category?.message}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="skill-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {SKILL_CATEGORY_LABEL[value]}
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
          name="startingProficiency"
          render={({ field }) => (
            <FormField
              label="Current proficiency (1–5)"
              htmlFor="skill-starting"
              description="Updates automatically once you log a review."
              error={errors.startingProficiency?.message}
            >
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="skill-starting">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCIES.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="targetProficiency"
          render={({ field }) => (
            <FormField
              label="Target proficiency (1–5)"
              htmlFor="skill-target"
              error={errors.targetProficiency?.message}
            >
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="skill-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCIES.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <FormField label="Next review" error={errors.nextReviewDate?.message}>
        <Input type="date" {...register("nextReviewDate")} />
      </FormField>

      <Controller
        control={control}
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="skill-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="skill-goal">
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
        name="pillarIds"
        render={({ field }) => (
          <FormField label="Life pillars" htmlFor="skill-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="skill-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <FormField label="Practice plan" optional error={errors.practicePlan?.message}>
        <Textarea
          rows={2}
          placeholder="How will you practice this?"
          {...register("practicePlan")}
        />
      </FormField>

      <FormField label="Evidence" htmlFor="skill-evidence" description="One per line.">
        <Textarea
          id="skill-evidence"
          rows={2}
          placeholder="Proof you've improved"
          {...register("evidenceText")}
        />
      </FormField>

      <FormField
        label="Resources"
        htmlFor="skill-resources"
        description="One per line — links or references."
      >
        <Textarea
          id="skill-resources"
          rows={2}
          placeholder="https://…"
          {...register("resourcesText")}
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

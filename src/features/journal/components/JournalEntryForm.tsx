"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { normalizeError } from "@/lib/errors";
import {
  JOURNAL_ENTRY_TYPES,
  JOURNAL_ENTRY_TYPE_LABEL,
  JOURNAL_ENTRY_TYPE_PROMPT,
  RATING_MAX,
  RATING_MIN,
  journalEntryFormSchema,
  type JournalEntryFormValues,
} from "../schema";

const NONE = "__none__";
const RATINGS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i);

export interface JournalEntryFormProps {
  goalOptions: GoalOption[];
  defaultValues?: Partial<JournalEntryFormValues>;
  submitLabel: string;
  onSubmit: (values: JournalEntryFormValues) => Promise<void>;
  onCancel: () => void;
}

export function JournalEntryForm({
  goalOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: JournalEntryFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      entryType: defaultValues?.entryType ?? "free-form",
      entryDate: defaultValues?.entryDate ?? new Date().toISOString().slice(0, 10),
      content: defaultValues?.content ?? "",
      gratitudeItemsText: defaultValues?.gratitudeItemsText ?? "",
      moodRating: defaultValues?.moodRating ?? 3,
      energyLevel: defaultValues?.energyLevel ?? 3,
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
      tagsText: defaultValues?.tagsText ?? "",
      isPrivate: defaultValues?.isPrivate ?? false,
    },
  });

  const entryType = useWatch({ control, name: "entryType" });

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="entryType"
          render={({ field }) => (
            <FormField label="Type" htmlFor="journal-type" error={errors.entryType?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="journal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOURNAL_ENTRY_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {JOURNAL_ENTRY_TYPE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <FormField label="Date" error={errors.entryDate?.message}>
          <Input type="date" {...register("entryDate")} />
        </FormField>
      </div>

      <FormField label="Title" optional error={errors.title?.message}>
        <Input placeholder="Optional" {...register("title")} />
      </FormField>

      {entryType === "gratitude" ? (
        <FormField
          label="Grateful for"
          htmlFor="journal-gratitude"
          error={errors.gratitudeItemsText?.message}
          description="One per line."
        >
          <Textarea
            id="journal-gratitude"
            rows={3}
            placeholder="A person, a moment, anything"
            {...register("gratitudeItemsText")}
          />
        </FormField>
      ) : null}

      <FormField label="Entry" error={errors.content?.message}>
        <Textarea
          rows={6}
          placeholder={JOURNAL_ENTRY_TYPE_PROMPT[entryType]}
          {...register("content")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="moodRating"
          render={({ field }) => (
            <FormField label="Mood (1–5)" htmlFor="journal-mood" error={errors.moodRating?.message}>
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="journal-mood">
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
          name="energyLevel"
          render={({ field }) => (
            <FormField
              label="Energy (1–5)"
              htmlFor="journal-energy"
              error={errors.energyLevel?.message}
            >
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="journal-energy">
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
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="journal-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="journal-goal">
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
          <FormField
            label="Life pillars"
            htmlFor="journal-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect
              id="journal-pillars"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <FormField label="Tags" htmlFor="journal-tags" error={errors.tagsText?.message}>
        <Input id="journal-tags" placeholder="Comma separated" {...register("tagsText")} />
      </FormField>

      <Controller
        control={control}
        name="isPrivate"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={field.value} onCheckedChange={field.onChange} />
            Private — collapse this entry by default
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

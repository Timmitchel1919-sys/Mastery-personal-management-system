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
import { normalizeError } from "@/lib/errors";
import {
  MAX_ACTION_ITEMS,
  MAX_HIGHLIGHTS,
  READING_STATUSES,
  READING_STATUS_LABEL,
  bookFormSchema,
  emptyActionItem,
  emptyHighlight,
  type BookFormValues,
} from "../schema";

const NONE = "__none__";

export interface BookFormProps {
  goalOptions: GoalOption[];
  defaultValues?: Partial<BookFormValues>;
  submitLabel: string;
  onSubmit: (values: BookFormValues) => Promise<void>;
  onCancel: () => void;
}

export function BookForm({
  goalOptions,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: BookFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      author: defaultValues?.author ?? "",
      readingStatus: defaultValues?.readingStatus ?? "want-to-read",
      currentPage: defaultValues?.currentPage ?? 0,
      totalPages: defaultValues?.totalPages ?? 0,
      startedDate: defaultValues?.startedDate ?? "",
      completedDate: defaultValues?.completedDate ?? "",
      highlights: defaultValues?.highlights ?? [],
      lessonsText: defaultValues?.lessonsText ?? "",
      actionItems: defaultValues?.actionItems ?? [],
      notes: defaultValues?.notes ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
      goalId: defaultValues?.goalId ?? "",
    },
  });

  const highlightFields = useFieldArray({ control, name: "highlights" });
  const actionItemFields = useFieldArray({ control, name: "actionItems" });

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
        <Input placeholder="Book title" {...register("title")} />
      </FormField>

      <FormField label="Author" optional error={errors.author?.message}>
        <Input placeholder="Optional" {...register("author")} />
      </FormField>

      <Controller
        control={control}
        name="readingStatus"
        render={({ field }) => (
          <FormField label="Status" htmlFor="book-status" error={errors.readingStatus?.message}>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="book-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {READING_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {READING_STATUS_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Current page" error={errors.currentPage?.message}>
          <Input type="number" min={0} {...register("currentPage", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Total pages" optional error={errors.totalPages?.message}>
          <Input type="number" min={0} {...register("totalPages", { valueAsNumber: true })} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Started" error={errors.startedDate?.message}>
          <Input type="date" {...register("startedDate")} />
        </FormField>
        <FormField label="Completed" error={errors.completedDate?.message}>
          <Input type="date" {...register("completedDate")} />
        </FormField>
      </div>

      <Controller
        control={control}
        name="goalId"
        render={({ field }) => (
          <FormField label="Goal" htmlFor="book-goal" error={errors.goalId?.message}>
            <Select
              value={field.value || NONE}
              onValueChange={(next) => field.onChange(next === NONE ? "" : next)}
            >
              <SelectTrigger id="book-goal">
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
          <FormField label="Life pillars" htmlFor="book-pillars" error={errors.pillarIds?.message}>
            <PillarSelect id="book-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
        )}
      />

      <fieldset className="border-border rounded-lg border p-3">
        <legend className="text-subtle px-1 text-xs font-medium">Highlights</legend>
        <div className="flex flex-col gap-2">
          {highlightFields.fields.length === 0 ? (
            <p className="text-subtle text-sm">No highlights yet — type in a quote as you read.</p>
          ) : null}
          {highlightFields.fields.map((highlight, index) => (
            <div key={highlight.id} className="flex items-start gap-2">
              <Textarea
                className="flex-1"
                rows={2}
                placeholder="Quote it exactly as written"
                {...register(`highlights.${index}.quote` as const)}
              />
              <Input
                type="number"
                min={0}
                className="w-20"
                placeholder="Page"
                {...register(`highlights.${index}.pageNumber` as const, {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
              />
              <IconButton
                size="sm"
                aria-label={`Remove highlight ${index + 1}`}
                icon={<Trash2 />}
                onClick={() => highlightFields.remove(index)}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={highlightFields.fields.length >= MAX_HIGHLIGHTS}
            onClick={() => highlightFields.append(emptyHighlight())}
          >
            <Plus />
            Add highlight
          </Button>
        </div>
      </fieldset>

      <FormField label="Lessons" htmlFor="book-lessons" description="One per line.">
        <Textarea
          id="book-lessons"
          rows={3}
          placeholder="What did this book teach you?"
          {...register("lessonsText")}
        />
      </FormField>

      <fieldset className="border-border rounded-lg border p-3">
        <legend className="text-subtle px-1 text-xs font-medium">Action items</legend>
        <div className="flex flex-col gap-2">
          {actionItemFields.fields.length === 0 ? (
            <p className="text-subtle text-sm">No action items yet.</p>
          ) : null}
          {actionItemFields.fields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <Controller
                control={control}
                name={`actionItems.${index}.completed` as const}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Input
                className="flex-1"
                placeholder="Something to actually do"
                {...register(`actionItems.${index}.title` as const)}
              />
              <IconButton
                size="sm"
                aria-label={`Remove action item ${index + 1}`}
                icon={<Trash2 />}
                onClick={() => actionItemFields.remove(index)}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={actionItemFields.fields.length >= MAX_ACTION_ITEMS}
            onClick={() => actionItemFields.append(emptyActionItem())}
          >
            <Plus />
            Add action item
          </Button>
        </div>
      </fieldset>

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

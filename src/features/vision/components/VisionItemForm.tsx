"use client";

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
import { useState } from "react";
import { normalizeError } from "@/lib/errors";
import {
  LIFE_VISION_CATEGORIES,
  LIFE_VISION_CATEGORY_META,
  lifeVisionCreateSchema,
  type LifeVisionCreate,
} from "../schema";

export interface VisionItemFormProps {
  defaultValues?: Partial<LifeVisionCreate>;
  submitLabel: string;
  onSubmit: (values: LifeVisionCreate) => Promise<void>;
  onCancel: () => void;
}

export function VisionItemForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: VisionItemFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LifeVisionCreate>({
    resolver: zodResolver(lifeVisionCreateSchema),
    defaultValues: {
      category: defaultValues?.category,
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      pillarIds: defaultValues?.pillarIds ?? [],
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

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <FormField label="Category" htmlFor="vision-category" error={errors.category?.message}>
            <Select
              value={field.value ?? ""}
              onValueChange={(next) => {
                field.onChange(next);
                // Pre-fill pillars from the category when none chosen yet.
                if ((getValues("pillarIds") ?? []).length === 0) {
                  setValue(
                    "pillarIds",
                    LIFE_VISION_CATEGORY_META[next as (typeof LIFE_VISION_CATEGORIES)[number]]
                      .defaultPillars,
                  );
                }
              }}
            >
              <SelectTrigger id="vision-category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {LIFE_VISION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {LIFE_VISION_CATEGORY_META[category].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <FormField label="Title" error={errors.title?.message}>
        <Input placeholder="A short name for this" {...register("title")} />
      </FormField>

      <FormField label="Detail" error={errors.content?.message}>
        <Textarea rows={5} placeholder="Describe it in your own words…" {...register("content")} />
      </FormField>

      <Controller
        control={control}
        name="pillarIds"
        render={({ field }) => (
          <FormField
            label="Life pillars"
            htmlFor="vision-pillars"
            error={errors.pillarIds?.message}
          >
            <PillarSelect id="vision-pillars" value={field.value ?? []} onChange={field.onChange} />
          </FormField>
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

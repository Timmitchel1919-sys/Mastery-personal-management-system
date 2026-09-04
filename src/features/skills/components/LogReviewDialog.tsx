"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import {
  PROFICIENCY_MAX,
  PROFICIENCY_MIN,
  skillReviewFormSchema,
  type Skill,
  type SkillReviewFormValues,
} from "../schema";

const PROFICIENCIES = Array.from(
  { length: PROFICIENCY_MAX - PROFICIENCY_MIN + 1 },
  (_, i) => PROFICIENCY_MIN + i,
);

interface ReviewFormProps {
  defaultProficiency: number;
  onSubmit: (values: SkillReviewFormValues) => Promise<void>;
  onCancel: () => void;
}

function ReviewForm({ defaultProficiency, onSubmit, onCancel }: ReviewFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SkillReviewFormValues>({
    resolver: zodResolver(skillReviewFormSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      proficiency: defaultProficiency,
      notes: "",
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </FormField>
        <Controller
          control={control}
          name="proficiency"
          render={({ field }) => (
            <FormField
              label="Proficiency (1–5)"
              htmlFor="review-proficiency"
              error={errors.proficiency?.message}
            >
              <Select
                value={String(field.value)}
                onValueChange={(next) => field.onChange(Number(next))}
              >
                <SelectTrigger id="review-proficiency">
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

      <FormField label="Notes" optional error={errors.notes?.message}>
        <Textarea rows={2} placeholder="What changed since last time?" {...register("notes")} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Log review
        </Button>
      </DialogFooter>
    </form>
  );
}

interface LogReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: Skill | null;
  currentProficiency: number;
  onSubmit: (values: SkillReviewFormValues) => Promise<void>;
}

export function LogReviewDialog({
  open,
  onOpenChange,
  skill,
  currentProficiency,
  onSubmit,
}: LogReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log a review{skill ? ` — ${skill.title}` : ""}</DialogTitle>
          <DialogDescription>
            Reassess your proficiency to build a progress history.
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          key={skill?.id ?? "none"}
          defaultProficiency={currentProficiency}
          onSubmit={async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

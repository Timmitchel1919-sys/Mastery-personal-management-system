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
  COPING_CATEGORIES,
  COPING_CATEGORY_LABEL,
  recoveryCopingActionFormSchema,
  type RecoveryCopingAction,
  type RecoveryCopingActionFormValues,
} from "../recovery-coping-schema";

interface CopingActionFormProps {
  initial?: RecoveryCopingAction | null;
  onSubmit: (values: RecoveryCopingActionFormValues) => Promise<void>;
  onCancel: () => void;
}

function CopingActionForm({ initial, onSubmit, onCancel }: CopingActionFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryCopingActionFormValues>({
    resolver: zodResolver(recoveryCopingActionFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      category: initial?.category ?? "grounding",
      howTo: initial?.howTo ?? "",
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

      <FormField label="Name" error={errors.title?.message}>
        <Input placeholder="e.g. Step outside for five minutes" {...register("title")} />
      </FormField>

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <FormField label="Type" htmlFor="coping-category">
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="coping-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COPING_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {COPING_CATEGORY_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <FormField
        label="How it helps"
        optional
        htmlFor="coping-how"
        description="A short reminder of what to do, for when it's hard to think."
        error={errors.howTo?.message}
      >
        <Textarea id="coping-how" rows={3} {...register("howTo")} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? "Save changes" : "Add to toolkit"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface CopingActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  editing?: RecoveryCopingAction | null;
  onSubmit: (values: RecoveryCopingActionFormValues) => Promise<void>;
}

export function CopingActionDialog({
  open,
  onOpenChange,
  goalId,
  editing,
  onSubmit,
}: CopingActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit coping action" : "Add a coping action"}</DialogTitle>
          <DialogDescription>
            Something you can reach for when an urge shows up. Stays private to this goal.
          </DialogDescription>
        </DialogHeader>
        <CopingActionForm
          key={`${goalId}:${editing?.id ?? "new"}`}
          initial={editing}
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

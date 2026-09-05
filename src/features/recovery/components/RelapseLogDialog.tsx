"use client";

import { useForm } from "react-hook-form";
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
  Textarea,
} from "@/components/ui";
import {
  recoveryRelapseFormSchema,
  type RecoveryRelapseFormValues,
} from "../recovery-relapse-schema";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface RelapseLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  logging: boolean;
  error: string | null;
  onSubmit: (values: RecoveryRelapseFormValues) => Promise<boolean>;
}

function RelapseForm({
  logging,
  error,
  onSubmit,
  onCancel,
}: {
  logging: boolean;
  error: string | null;
  onSubmit: (values: RecoveryRelapseFormValues) => Promise<boolean>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoveryRelapseFormValues>({
    resolver: zodResolver(recoveryRelapseFormSchema),
    defaultValues: {
      date: todayIso(),
      whatHappened: "",
      contributingFactorsText: "",
      lessonsLearned: "",
      restartPlan: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <p className="text-muted text-sm">
        A setback is part of the process, not the end of it. Noting what happened — kindly — is how
        you learn from it. Your streak simply starts again from here.
      </p>

      {error ? (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="When" error={errors.date?.message}>
        <Input type="date" {...register("date")} />
      </FormField>

      <FormField label="What happened" error={errors.whatHappened?.message}>
        <Textarea rows={3} placeholder="In your own words" {...register("whatHappened")} />
      </FormField>

      <FormField
        label="What contributed"
        htmlFor="relapse-factors"
        description="One per line — no blame, just observations."
      >
        <Textarea id="relapse-factors" rows={2} {...register("contributingFactorsText")} />
      </FormField>

      <FormField label="What you take from it" optional error={errors.lessonsLearned?.message}>
        <Textarea rows={2} {...register("lessonsLearned")} />
      </FormField>

      <FormField label="Your restart plan" optional error={errors.restartPlan?.message}>
        <Textarea
          rows={2}
          placeholder="One small thing you'll do next"
          {...register("restartPlan")}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={logging}>
          Save &amp; restart
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RelapseLogDialog({
  open,
  onOpenChange,
  goalId,
  logging,
  error,
  onSubmit,
}: RelapseLogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a setback</DialogTitle>
          <DialogDescription>This stays private, like everything here.</DialogDescription>
        </DialogHeader>
        <RelapseForm
          key={goalId}
          logging={logging}
          error={error}
          onSubmit={async (values) => {
            const ok = await onSubmit(values);
            if (ok) onOpenChange(false);
            return ok;
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

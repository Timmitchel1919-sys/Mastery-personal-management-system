"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
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
  Switch,
} from "@/components/ui";
import { normalizeError } from "@/lib/errors";
import {
  ACCOUNTABILITY_CUSTOM_FIELD_LABEL,
  ACCOUNTABILITY_CUSTOM_FIELDS,
  ACCOUNTABILITY_SCOPES,
  ACCOUNTABILITY_SCOPE_DESCRIPTION,
  ACCOUNTABILITY_SCOPE_LABEL,
  accountabilityFormSchema,
  type AccountabilityCustomField,
  type AccountabilityFormValues,
  type RecoveryAccountabilityPartner,
} from "../recovery-accountability-schema";

interface FormProps {
  editing: RecoveryAccountabilityPartner | null;
  onSubmit: (values: AccountabilityFormValues) => Promise<void>;
  onCancel: () => void;
}

function PartnerForm({ editing, onSubmit, onCancel }: FormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountabilityFormValues>({
    resolver: zodResolver(accountabilityFormSchema),
    defaultValues: {
      partnerEmail: editing?.partnerEmail ?? "",
      partnerLabel: editing?.partnerLabel ?? "",
      scope: editing?.scope ?? "streak-only",
      customFields: editing?.customFields ?? [],
      includeSetbackCount: editing?.includeSetbackCount ?? false,
      sendCheckInReminders: editing?.sendCheckInReminders ?? false,
      expiresAt: editing?.expiresAt ?? "",
    },
  });

  const scope = useWatch({ control, name: "scope" });
  const showCustom = scope === "custom-limited-access";
  const showSetbackToggle = scope === "selected-summary" || scope === "custom-limited-access";

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

      <FormField label="Their email" error={errors.partnerEmail?.message}>
        <Input
          type="email"
          placeholder="name@example.com"
          disabled={Boolean(editing)}
          {...register("partnerEmail")}
        />
      </FormField>

      <FormField label="Label" error={errors.partnerLabel?.message}>
        <Input placeholder="e.g. My sponsor" {...register("partnerLabel")} />
      </FormField>

      <Controller
        control={control}
        name="scope"
        render={({ field }) => (
          <FormField
            label="What they can see"
            htmlFor="partner-scope"
            description={ACCOUNTABILITY_SCOPE_DESCRIPTION[scope]}
          >
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="partner-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTABILITY_SCOPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ACCOUNTABILITY_SCOPE_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      {showCustom ? (
        <FormField label="Fields they see" description="They see only what you tick.">
          <div className="flex flex-col gap-2">
            {ACCOUNTABILITY_CUSTOM_FIELDS.map((fieldName) => (
              <Controller
                key={fieldName}
                control={control}
                name="customFields"
                render={({ field }) => {
                  const checked = field.value.includes(fieldName);
                  return (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          const set = new Set<AccountabilityCustomField>(field.value);
                          if (next === true) set.add(fieldName);
                          else set.delete(fieldName);
                          field.onChange([...set]);
                        }}
                      />
                      {ACCOUNTABILITY_CUSTOM_FIELD_LABEL[fieldName]}
                    </label>
                  );
                }}
              />
            ))}
          </div>
        </FormField>
      ) : null}

      {showSetbackToggle ? (
        <Controller
          control={control}
          name="includeSetbackCount"
          render={({ field }) => (
            <FormField
              label="Show a setback count"
              htmlFor="partner-setbacks"
              description="A number only — never what happened or why."
            >
              <Switch
                id="partner-setbacks"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormField>
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="sendCheckInReminders"
        render={({ field }) => (
          <FormField
            label="Send them check-in reminders"
            htmlFor="partner-reminders"
            description="Reminder delivery arrives in a later update."
          >
            <Switch id="partner-reminders" checked={field.value} onCheckedChange={field.onChange} />
          </FormField>
        )}
      />

      <FormField label="Access ends on" optional error={errors.expiresAt?.message}>
        <Input type="date" {...register("expiresAt")} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {editing ? "Save changes" : "Share with them"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  editing: RecoveryAccountabilityPartner | null;
  onSubmit: (values: AccountabilityFormValues) => Promise<void>;
}

export function AccountabilityPartnerDialog({
  open,
  onOpenChange,
  goalId,
  editing,
  onSubmit,
}: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit shared view" : "Share with a partner"}</DialogTitle>
          <DialogDescription>
            They see only the slice you choose here — never your notes, triggers, setback details,
            or coach conversations.
          </DialogDescription>
        </DialogHeader>
        <PartnerForm
          key={`${goalId}:${editing?.id ?? "new"}`}
          editing={editing}
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

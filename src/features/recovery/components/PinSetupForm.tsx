"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
} from "@/components/ui";
import { pinFormSchema, type PinFormValues } from "../schema";

interface PinSetupFormProps {
  busy: boolean;
  error: string | null;
  onSubmit: (pin: string) => Promise<void>;
}

export function PinSetupForm({ busy, error, onSubmit }: PinSetupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PinFormValues>({ resolver: zodResolver(pinFormSchema) });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.pin);
  });

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold">Protect the Recovery Center</h2>
          <p className="text-muted text-sm">
            Set a 4–6 digit PIN. It keeps this space private from anyone glancing at your screen —
            it is separate from your account password.
          </p>
        </div>

        {error ? (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <FormField label="PIN" error={errors.pin?.message}>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              autoFocus
              {...register("pin")}
            />
          </FormField>
          <FormField label="Confirm PIN" error={errors.confirmPin?.message}>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              {...register("confirmPin")}
            />
          </FormField>
          <Button type="submit" className="w-full" loading={busy}>
            Set PIN
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

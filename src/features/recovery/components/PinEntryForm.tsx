"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from "@/components/ui";
import { pinEntrySchema, type PinEntryValues } from "../schema";

interface PinEntryFormProps {
  busy: boolean;
  error: string | null;
  onSubmit: (pin: string) => Promise<boolean>;
  onReset: () => Promise<void>;
}

export function PinEntryForm({ busy, error, onSubmit, onReset }: PinEntryFormProps) {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<PinEntryValues>({
    resolver: zodResolver(pinEntrySchema),
    defaultValues: { pin: "" },
  });

  const submit = handleSubmit(async (values) => {
    const ok = await onSubmit(values.pin);
    if (!ok) resetForm({ pin: "" });
  });

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold">Recovery Center is locked</h2>
          <p className="text-muted text-sm">Enter your PIN to continue.</p>
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
          <Button type="submit" className="w-full" loading={busy}>
            Unlock
          </Button>
        </form>

        <button
          type="button"
          className="text-muted hover:text-foreground w-full text-center text-sm underline-offset-2 hover:underline"
          onClick={() => setConfirmResetOpen(true)}
        >
          Forgot your PIN?
        </button>
      </CardContent>

      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your PIN?</DialogTitle>
            <DialogDescription>
              You&apos;ll set a new PIN right away. This only resets the lock — it does not affect
              your account or sign-in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={resetting}
              onClick={async () => {
                setResetting(true);
                try {
                  await onReset();
                  setConfirmResetOpen(false);
                } finally {
                  setResetting(false);
                }
              }}
            >
              Reset PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

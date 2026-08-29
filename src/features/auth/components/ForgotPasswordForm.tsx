"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, Button, FormField, Input } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { authErrorMessage } from "../auth-errors";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schema";

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await sendPasswordReset(values);
      setSent(true);
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  });

  if (sent) {
    return (
      <Alert variant="success">
        <AlertDescription>
          If an account exists for that email, a password reset link is on its way. Check your inbox
          and spam folder.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" autoFocus {...register("email")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}

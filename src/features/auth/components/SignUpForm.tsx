"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, Button, FormField, Input } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { authErrorMessage } from "../auth-errors";
import { signUpSchema, type SignUpInput } from "../schema";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signUp(values);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Name" error={errors.displayName?.message}>
        <Input type="text" autoComplete="name" autoFocus {...register("displayName")} />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </FormField>

      <FormField
        label="Password"
        description="At least 8 characters."
        error={errors.password?.message}
      >
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </FormField>

      <FormField label="Confirm password" error={errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>

      <div className="text-muted flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>

      <GoogleSignInButton onError={setFormError} disabled={isSubmitting} />
    </form>
  );
}

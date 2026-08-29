"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, Button, FormField, Input } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { authErrorMessage } from "../auth-errors";
import { signInSchema, type SignInInput } from "../schema";
import { GoogleSignInButton } from "./GoogleSignInButton";

function safeNext(raw: string | null): string {
  // Only allow same-origin relative paths as a redirect target.
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(values);
      router.replace(next);
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

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" autoFocus {...register("email")} />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign in
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

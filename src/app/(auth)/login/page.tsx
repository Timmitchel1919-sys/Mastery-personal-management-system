import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, SignInForm } from "@/features/auth";
import { LoadingState } from "@/components/shared";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back."
      description="Continue your journey."
      variant="glass"
      logo={<Logo variant="full" height={30} />}
      footer={
        <>
          New to Mastery?{" "}
          <Link className="text-primary underline underline-offset-4" href="/register">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<LoadingState />}>
        <SignInForm />
      </Suspense>
      <p className="text-center text-sm">
        <Link className="text-muted underline underline-offset-4" href="/forgot-password">
          Forgot your password?
        </Link>
      </p>
    </AuthCard>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AuthCard, SignInForm } from "@/features/auth";
import { LoadingState } from "@/components/shared";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      variant="glass"
      logo={
        <Image
          src="/brand/mastery-logo.png"
          alt="Mastery"
          width={960}
          height={332}
          className="h-8 w-auto"
          priority
        />
      }
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

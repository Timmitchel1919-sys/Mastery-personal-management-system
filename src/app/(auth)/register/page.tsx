import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, SignUpForm } from "@/features/auth";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Turn long-term vision into daily execution."
      footer={
        <>
          Already have an account?{" "}
          <Link className="text-primary underline underline-offset-4" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, SignUpForm } from "@/features/auth";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your MASTERY."
      description="Build a system around the life you want to live."
      variant="glass"
      logo={<Logo variant="full" height={30} />}
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

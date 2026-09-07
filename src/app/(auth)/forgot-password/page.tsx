import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, ForgotPasswordForm } from "@/features/auth";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to set a new one."
      variant="glass"
      logo={<Logo variant="full" height={30} />}
      footer={
        <Link className="text-primary underline underline-offset-4" href="/login">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

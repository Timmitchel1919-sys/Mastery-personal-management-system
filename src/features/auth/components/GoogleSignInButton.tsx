"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { authErrorMessage } from "../auth-errors";

export function GoogleSignInButton({
  onError,
  disabled,
}: {
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const { signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      loading={pending}
      disabled={disabled}
      onClick={async () => {
        setPending(true);
        try {
          await signInWithGoogle();
        } catch (error) {
          onError?.(authErrorMessage(error));
        } finally {
          setPending(false);
        }
      }}
    >
      <GoogleGlyph />
      Continue with Google
    </Button>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.35a6.6 6.6 0 0 1 0-4.7V6.81H2.18a11 11 0 0 0 0 10.38l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.81l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

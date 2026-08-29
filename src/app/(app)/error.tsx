"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared";
import { normalizeError } from "@/lib/errors";

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(normalizeError(error));
  }, [error]);

  return (
    <ErrorState
      className="min-h-[60vh]"
      title="This section failed to load"
      description="An unexpected error occurred while loading this view."
      onRetry={reset}
    />
  );
}

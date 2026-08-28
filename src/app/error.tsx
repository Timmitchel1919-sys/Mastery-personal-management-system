"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared";
import { normalizeError } from "@/lib/errors";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Layer 1: log to the console only. A real error reporter is wired in a later layer.
    console.error(normalizeError(error));
  }, [error]);

  return (
    <ErrorState
      className="min-h-[50vh]"
      title="Something went wrong"
      description="An unexpected error occurred while loading this view."
      onRetry={reset}
    />
  );
}

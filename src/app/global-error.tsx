"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown in the root layout itself. It replaces the entire document,
 * so it cannot rely on globals.css or design tokens — keep styling self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>Application error</h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.8 }}>
            The application failed to load. Please reload the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              border: "1px solid currentColor",
              borderRadius: "0.375rem",
              padding: "0.375rem 0.75rem",
              fontSize: "0.875rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

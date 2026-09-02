import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// Emitted as a static JSON asset by `output: "export"` (ADR-0015). Doubles as a
// deploy smoke check; `timestamp` is the build time, `environment` the build-time env.
export const dynamic = "force-static";

/** Lightweight health/version marker. Exercises the validated env module at build time. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    environment: env.NEXT_PUBLIC_APP_ENV,
    timestamp: new Date().toISOString(),
  });
}

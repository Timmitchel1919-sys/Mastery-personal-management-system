import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Lightweight liveness probe. Exercises the validated env module server-side. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    environment: env.NEXT_PUBLIC_APP_ENV,
    timestamp: new Date().toISOString(),
  });
}

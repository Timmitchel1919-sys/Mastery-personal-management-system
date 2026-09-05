import { onCall, type CallableRequest } from "firebase-functions/https";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { DEFAULT_RUNTIME_OPTIONS } from "../config/region";
import { requireAuth } from "../shared/auth";
import { badRequest, notFound, permissionDenied, toHttpsError } from "../shared/errors";
import { validateRequest, validateResponse } from "../shared/validation";
import { adminDb } from "../shared/firebase-admin";
import {
  buildAccountabilityProjection,
  type AccountabilityScope,
} from "./accountability-projection";

/**
 * Layer 15F — the **only** way an accountability partner sees anything. Per
 * `docs/RECOVERY_PRIVACY.md` §3, partners never get direct Firestore access: they call
 * this authorized function, which checks that the caller's verified email matches an
 * active, unexpired, unrevoked grant and then returns nothing but the scoped projection.
 *
 * Written and unit-tested this layer; NOT deployed — the project is on the Spark plan.
 */

const requestSchema = z.object({
  ownerUid: z.string().trim().min(1),
  partnerId: z.string().trim().min(1),
});

const projectionResponseSchema = z.object({
  scope: z.enum([
    "streak-only",
    "status-only",
    "check-in-completed",
    "selected-summary",
    "custom-limited-access",
  ]),
  partnerLabel: z.string(),
  goalBehavior: z.string(),
  recoveryStatus: z.string().nullable(),
  currentStreak: z.number().nullable(),
  daysOnTrack: z.number().nullable(),
  checkedInToday: z.boolean().nullable(),
  lastCheckInDate: z.string().nullable(),
  setbackCount: z.number().nullable(),
  generatedAt: z.string(),
});

interface Deps {
  db: Firestore;
  now?: Date;
}

export async function handleGetAccountabilityProjection(
  request: CallableRequest<unknown>,
  deps: Deps = { db: adminDb() },
): Promise<z.infer<typeof projectionResponseSchema>> {
  const callerUid = requireAuth(request);
  const now = deps.now ?? new Date();
  const input = validateRequest(requestSchema, request.data);

  const token = (request.auth?.token ?? {}) as { email?: string; email_verified?: boolean };
  const callerEmail = token.email?.trim().toLowerCase();
  if (!callerEmail || token.email_verified !== true) {
    throw permissionDenied("A verified email address is required to view a shared projection");
  }

  const grantSnap = await deps.db
    .doc(`users/${input.ownerUid}/recoveryAccountabilityPartners/${input.partnerId}`)
    .get();
  if (!grantSnap.exists) throw notFound("That shared view was not found");
  const grant = grantSnap.data() as Record<string, unknown>;

  if (grant.partnerEmail !== callerEmail || callerUid === input.ownerUid) {
    // The owner has their own views; this endpoint is for the partner only.
    throw permissionDenied("This shared view is not addressed to you");
  }
  if (grant.revokedAt != null) {
    throw permissionDenied("The owner has revoked this shared view");
  }
  if (typeof grant.expiresAt === "string" && grant.expiresAt < now.toISOString().slice(0, 10)) {
    throw permissionDenied("This shared view has expired");
  }

  const goalId = typeof grant.goalId === "string" ? grant.goalId : "";
  if (!goalId) throw badRequest("This shared view is misconfigured");

  const projection = await buildAccountabilityProjection(
    deps.db,
    input.ownerUid,
    {
      goalId,
      scope: grant.scope as AccountabilityScope,
      partnerLabel: typeof grant.partnerLabel === "string" ? grant.partnerLabel : "",
      customFields: Array.isArray(grant.customFields) ? (grant.customFields as string[]) : [],
      includeSetbackCount: grant.includeSetbackCount === true,
    },
    now,
  );
  if (!projection) throw notFound("The shared goal was not found");

  return validateResponse(projectionResponseSchema, projection);
}

export const getAccountabilityProjection = onCall(
  { ...DEFAULT_RUNTIME_OPTIONS },
  async (request) => {
    try {
      return await handleGetAccountabilityProjection(request);
    } catch (error) {
      throw toHttpsError(error);
    }
  },
);

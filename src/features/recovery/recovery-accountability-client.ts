import { collection, getDocs, limit as fbLimit, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { AppError, mapFirebaseError, mapFunctionsError } from "@/lib/errors";
import {
  accountabilityProjectionSchema,
  configureAccountabilityResultSchema,
  recoveryAccountabilityPartnerSchema,
  type AccountabilityProjection,
  type ConfigureAccountabilityRequest,
  type ConfigureAccountabilityResult,
  type GetAccountabilityProjectionRequest,
  type RecoveryAccountabilityPartner,
} from "./recovery-accountability-schema";

function requireUid(): string {
  const uid = getFirebaseClient().auth.currentUser?.uid;
  if (!uid) throw new AppError("You must be signed in to do that", { code: "unauthenticated" });
  return uid;
}

/** Owner side: create / update / revoke a grant. Grants are Cloud-Function-only writes. */
export async function configureAccountabilityPartner(
  payload: ConfigureAccountabilityRequest,
): Promise<ConfigureAccountabilityResult> {
  const callable = httpsCallable(getFirebaseClient().functions, "configureAccountabilityPartner");
  try {
    const result = await callable(payload);
    return configureAccountabilityResultSchema.parse(result.data);
  } catch (error) {
    throw mapFunctionsError(error);
  }
}

/** Owner side: read-only list of the caller's own grants for one goal. */
export async function listAccountabilityPartners(
  goalId: string,
  max = 50,
): Promise<RecoveryAccountabilityPartner[]> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(
        collection(
          getFirebaseClient().db,
          "users",
          uid,
          "recoveryAccountabilityPartners",
        ).withConverter(makeConverter(recoveryAccountabilityPartnerSchema)),
        orderBy("createdAt", "desc"),
        fbLimit(max),
      ),
    );
    return snapshot.docs
      .map((entry) => entry.data())
      .filter((entry) => entry.status === "active" && entry.goalId === goalId);
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** Partner side: the only way to see anything — an authorized, scoped projection. */
export async function getAccountabilityProjection(
  payload: GetAccountabilityProjectionRequest,
): Promise<AccountabilityProjection> {
  const callable = httpsCallable(getFirebaseClient().functions, "getAccountabilityProjection");
  try {
    const result = await callable(payload);
    return accountabilityProjectionSchema.parse(result.data);
  } catch (error) {
    throw mapFunctionsError(error);
  }
}

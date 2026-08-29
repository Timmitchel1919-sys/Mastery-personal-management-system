import { increment, serverTimestamp, type FieldValue } from "firebase/firestore";

/**
 * Audit-field builders. Timestamps use Firestore server timestamps on write; the
 * repository returns a locally-timestamped object so callers don't need a re-read.
 */

export interface CreateAuditFields {
  status: "active";
  version: 1;
  archivedAt: null;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  createdBy: string;
  updatedBy: string;
}

export interface UpdateAuditFields {
  updatedAt: FieldValue;
  updatedBy: string;
  version: FieldValue;
}

export function buildCreateAudit(uid: string): CreateAuditFields {
  return {
    status: "active",
    version: 1,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  };
}

export function buildUpdateAudit(uid: string): UpdateAuditFields {
  return {
    updatedAt: serverTimestamp(),
    updatedBy: uid,
    version: increment(1),
  };
}

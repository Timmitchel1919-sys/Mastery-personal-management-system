"use client";

import { useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import { getAccountabilityProjection } from "./recovery-accountability-client";
import type { AccountabilityProjection } from "./recovery-accountability-schema";

type Status = "loading" | "ready" | "error";

interface State {
  status: Status;
  projection: AccountabilityProjection | null;
  error: string | null;
}

const LOADING: State = { status: "loading", projection: null, error: null };
const MISSING: State = {
  status: "error",
  projection: null,
  error: "This link is missing information. Ask for a fresh one.",
};

/** Partner side — loads the one scoped projection the owner granted this viewer. */
export function useAccountabilityProjection(ownerUid: string | null, partnerId: string | null) {
  const { status: authStatus } = useAuth();
  const linkOk = Boolean(ownerUid && partnerId);
  const [fetched, setFetched] = useState<State | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || !linkOk || !ownerUid || !partnerId) return;
    let cancelled = false;

    getAccountabilityProjection({ ownerUid, partnerId }).then(
      (loaded) => {
        if (!cancelled) setFetched({ status: "ready", projection: loaded, error: null });
      },
      (caught) => {
        if (!cancelled) {
          setFetched({
            status: "error",
            projection: null,
            error: normalizeError(caught).message,
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authStatus, linkOk, ownerUid, partnerId]);

  if (!linkOk) return MISSING;
  return fetched ?? LOADING;
}

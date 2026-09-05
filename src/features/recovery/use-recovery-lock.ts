"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeError } from "@/lib/errors";
import { useAuth } from "@/providers/auth-provider";
import {
  getRecoveryLock,
  resetRecoveryPin,
  setRecoveryPin,
  verifyRecoveryPin,
} from "./recovery-lock-repository";

type Status = "loading" | "ready" | "error";

/**
 * The "unlocked" state lives in `sessionStorage` (per browser tab, cleared when the tab
 * closes) rather than `localStorage` — a new tab or a restarted browser always re-prompts,
 * which is the more privacy-conservative default for this module. Keyed by uid so a
 * different user signing in on the same tab never inherits someone else's unlocked state.
 */
const UNLOCK_TTL_MS = 15 * 60 * 1000;

function unlockKey(uid: string): string {
  return `mastery:recovery-unlocked:${uid}`;
}

function readUnlockedAt(uid: string): number | null {
  try {
    const raw = sessionStorage.getItem(unlockKey(uid));
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeUnlockedNow(uid: string): void {
  try {
    sessionStorage.setItem(unlockKey(uid), String(Date.now()));
  } catch {
    // Private browsing / storage disabled — the gate will simply re-prompt next time.
  }
}

function clearUnlocked(uid: string): void {
  try {
    sessionStorage.removeItem(unlockKey(uid));
  } catch {
    // Nothing to clean up if storage was never writable.
  }
}

export function useRecoveryLock() {
  const { user, status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || !user) return;
    let cancelled = false;

    getRecoveryLock().then(
      (profile) => {
        if (cancelled) return;
        setHasPin(profile !== null);
        const unlockedAt = readUnlockedAt(user.uid);
        setUnlocked(unlockedAt !== null && Date.now() - unlockedAt < UNLOCK_TTL_MS);
        setStatus("ready");
        setError(null);
      },
      (caught) => {
        if (cancelled) return;
        setStatus("error");
        setError(normalizeError(caught).message);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [authStatus, user]);

  const setup = useCallback(
    async (pin: string) => {
      setBusy(true);
      setPinError(null);
      try {
        await setRecoveryPin(pin);
        setHasPin(true);
        if (user) writeUnlockedNow(user.uid);
        setUnlocked(true);
      } catch (caught) {
        setPinError(normalizeError(caught).message);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  const unlock = useCallback(
    async (pin: string) => {
      setBusy(true);
      setPinError(null);
      try {
        const ok = await verifyRecoveryPin(pin);
        if (!ok) {
          setPinError("Incorrect PIN");
          return false;
        }
        if (user) writeUnlockedNow(user.uid);
        setUnlocked(true);
        return true;
      } catch (caught) {
        setPinError(normalizeError(caught).message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  const lock = useCallback(() => {
    if (user) clearUnlocked(user.uid);
    setUnlocked(false);
  }, [user]);

  const reset = useCallback(async () => {
    setBusy(true);
    setPinError(null);
    try {
      await resetRecoveryPin();
      setHasPin(false);
      if (user) clearUnlocked(user.uid);
      setUnlocked(false);
    } catch (caught) {
      setPinError(normalizeError(caught).message);
      throw caught;
    } finally {
      setBusy(false);
    }
  }, [user]);

  return { status, error, hasPin, unlocked, busy, pinError, setup, unlock, lock, reset };
}

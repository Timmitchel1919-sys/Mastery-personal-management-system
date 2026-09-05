import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { makeConverter } from "@/lib/firebase";
import { mapFirebaseError } from "@/lib/errors";
import {
  userProfileSchema,
  userProfileUpdateSchema,
  type UserProfile,
  type UserProfileUpdate,
} from "./schema";

const userProfileConverter = makeConverter(userProfileSchema);

function profileRef(uid: string) {
  return doc(getFirebaseClient().db, "users", uid).withConverter(userProfileConverter);
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** The default profile written for a brand-new user. `role` is always `user`. */
export function buildDefaultProfile(
  user: Pick<User, "uid" | "email" | "displayName" | "photoURL">,
): UserProfile {
  const now = new Date().toISOString();
  return {
    id: user.uid,
    displayName: user.displayName?.trim() || user.email?.split("@")[0] || "New user",
    email: user.email ?? "",
    photoURL: user.photoURL ?? null,
    role: "user",
    language: "en",
    theme: "system",
    timezone: detectTimezone(),
    accentColorPreference: null,
    onboardingCompleted: false,
    weeklySummaryEnabled: true,
    status: "active",
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
  };
}

/**
 * User-scoped repository for `users/{uid}`. The uid always comes from the authenticated
 * Firebase user object — never from arbitrary client input.
 */
export const userProfileRepository = {
  async get(uid: string): Promise<UserProfile | null> {
    try {
      const snapshot = await getDoc(profileRef(uid));
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      throw mapFirebaseError(error);
    }
  },

  /**
   * Create the profile document on first sign-in if it does not exist yet.
   * Returns the current profile (existing or freshly created).
   */
  async ensure(user: User): Promise<UserProfile> {
    try {
      const ref = doc(getFirebaseClient().db, "users", user.uid);
      const existing = await getDoc(ref.withConverter(userProfileConverter));
      if (existing.exists()) {
        return existing.data();
      }

      const profile = buildDefaultProfile(user);
      await setDoc(ref, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return profile;
    } catch (error) {
      throw mapFirebaseError(error);
    }
  },

  async update(uid: string, patch: UserProfileUpdate): Promise<void> {
    const clean = userProfileUpdateSchema.parse(patch);
    try {
      await updateDoc(doc(getFirebaseClient().db, "users", uid), {
        ...clean,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
        version: increment(1),
      });
    } catch (error) {
      throw mapFirebaseError(error);
    }
  },
};

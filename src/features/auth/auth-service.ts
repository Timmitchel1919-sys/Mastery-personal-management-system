import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { toAuthError } from "./auth-errors";

let persistenceReady: Promise<void> | null = null;

/** Ensure auth state survives reloads (idempotent). */
function ensurePersistence(): Promise<void> {
  if (!persistenceReady) {
    const { auth } = getFirebaseClient();
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => {
      // Falls back to in-memory persistence (private mode / storage blocked).
      persistenceReady = Promise.resolve();
    });
  }
  return persistenceReady;
}

export interface EmailCredentials {
  email: string;
  password: string;
}

/**
 * Thin wrapper around Firebase Auth. Every method rejects with a normalized
 * {@link AppError} (see `toAuthError`) so callers never see raw Firebase errors.
 */
export const authService = {
  async signUpWithEmail({
    email,
    password,
    displayName,
  }: EmailCredentials & { displayName: string }): Promise<User> {
    try {
      await ensurePersistence();
      const { auth } = getFirebaseClient();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateFirebaseProfile(credential.user, { displayName });
      }
      return credential.user;
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async signInWithEmail({ email, password }: EmailCredentials): Promise<User> {
    try {
      await ensurePersistence();
      const { auth } = getFirebaseClient();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async signInWithGoogle(): Promise<User> {
    try {
      await ensurePersistence();
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      return credential.user;
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    try {
      const { auth } = getFirebaseClient();
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async signOut(): Promise<void> {
    try {
      const { auth } = getFirebaseClient();
      await firebaseSignOut(auth);
    } catch (error) {
      throw toAuthError(error);
    }
  },

  /** Subscribe to auth-state changes. Returns an unsubscribe function. */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const { auth } = getFirebaseClient();
    return firebaseOnAuthStateChanged(auth, callback);
  },

  getCurrentUser(): User | null {
    return getFirebaseClient().auth.currentUser;
  },
};

export type { User };

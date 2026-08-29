"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authService, type User } from "@/features/auth/auth-service";
import { userProfileRepository } from "@/features/auth/user-profile-repository";
import type {
  ForgotPasswordInput,
  SignInInput,
  SignUpInput,
  UserProfile,
} from "@/features/auth/schema";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (input: ForgotPasswordInput) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (nextUser) => {
      currentUidRef.current = nextUser?.uid ?? null;

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }

      setUser(nextUser);
      try {
        const ensured = await userProfileRepository.ensure(nextUser);
        // Ignore if the user changed while we were awaiting.
        if (currentUidRef.current === nextUser.uid) {
          setProfile(ensured);
        }
      } catch {
        // Profile load failed; the user is still authenticated. A later retry or
        // the settings screen can recover it.
        if (currentUidRef.current === nextUser.uid) {
          setProfile(null);
        }
      } finally {
        if (currentUidRef.current === nextUser.uid) {
          setStatus("authenticated");
        }
      }
    });

    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = currentUidRef.current;
    if (!uid) return;
    const fresh = await userProfileRepository.get(uid);
    if (currentUidRef.current === uid) {
      setProfile(fresh);
    }
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await authService.signInWithEmail(input);
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    await authService.signUpWithEmail({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);

  const sendPasswordReset = useCallback(async (input: ForgotPasswordInput) => {
    await authService.sendPasswordReset(input.email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      refreshProfile,
    }),
    [
      status,
      user,
      profile,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

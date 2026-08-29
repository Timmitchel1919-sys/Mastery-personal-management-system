import { z } from "zod";
import { THEMES } from "@/lib/theme";

/* ── Form schemas (validated at the form trust boundary) ─────────── */

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "That is too long");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    displayName: z.string().trim().min(1, "Enter your name").max(80, "That is too long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/* ── User profile (Firestore `users/{uid}`) ─────────────────────── */

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SUPPORTED_LANGUAGES = ["en", "nl"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const userProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).max(120),
  email: z.string().email(),
  photoURL: z.string().url().nullable().default(null),
  role: z.enum(USER_ROLES).default("user"),
  language: z.enum(SUPPORTED_LANGUAGES).catch("en").default("en"),
  theme: z.enum(THEMES).catch("system").default("system"),
  timezone: z.string().min(1).default("UTC"),
  accentColorPreference: z.string().min(1).nullable().default(null),
  onboardingCompleted: z.boolean().default(false),
  status: z.enum(["active", "disabled"]).default("active"),
  version: z.number().int().nonnegative().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

/** Fields a user may change about their own profile from the client. */
export const userProfileUpdateSchema = userProfileSchema
  .pick({
    displayName: true,
    photoURL: true,
    language: true,
    theme: true,
    timezone: true,
    accentColorPreference: true,
    onboardingCompleted: true,
  })
  .partial();
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;

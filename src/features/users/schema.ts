import { z } from "zod";

import { userRoles } from "@/config/enums";
import { limits } from "@/config/limits";

export { userRoles };
export type UserRole = (typeof userRoles)[number];

/** The signed-in user as the app sees it: narrow, no secrets (ADR-025). */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Unit a `mitra` account belongs to; `null` for staff. */
  unitId: string | null;
};

/*
 * Form schemas are shared by React Hook Form and the Server Actions. Messages are stable codes
 * translated by the forms (`Auth.errors.<code>`).
 */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "emailRequired")
  .pipe(z.email("emailInvalid"));

export const signInSchema = z.object({
  email: emailSchema,
  // Not checked for strength here: an old password must still be accepted at sign-in.
  password: z.string().min(1, "passwordRequired").max(limits.auth.passwordMax, "passwordTooLong"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(limits.auth.passwordMin, "passwordTooShort")
      .max(limits.auth.passwordMax, "passwordTooLong"),
    confirmPassword: z.string().min(1, "confirmRequired"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = newPasswordSchema.and(
  z.object({ token: z.string().min(1, "tokenInvalid") }),
);

export type SignInInput = z.input<typeof signInSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.input<typeof newPasswordSchema>;

export const authErrors = [
  "invalid",
  "invalidCredentials",
  "accountDisabled",
  "rateLimited",
  "tokenInvalid",
  "unknown",
] as const;
export type AuthError = (typeof authErrors)[number];

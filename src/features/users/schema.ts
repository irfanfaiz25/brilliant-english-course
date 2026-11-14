import { z } from "zod";

import { userRoles } from "@/config/enums";
import { limits } from "@/config/limits";
import { textField } from "@/lib/form-schemas";

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
  "currentPasswordWrong",
  "unknown",
] as const;
export type AuthError = (typeof authErrors)[number];

/*
 * Users module (Phase 4g). A super admin creates accounts with a role (a `mitra` also needs its
 * unit) and sends the person an activation link; nobody types a password for someone else.
 * Messages are `AdminForms.errors` codes.
 */

const U = limits.users;

/** Lowercased like Better Auth stores it, so "Ana@BEC.id" and "ana@bec.id" are one account. */
export const accountEmailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "required")
  .max(U.emailMax, `tooLong:${U.emailMax}`)
  .pipe(z.email("emailInvalid"));

export const userFormSchema = z
  .object({
    name: textField(2, U.nameMax),
    email: accountEmailField,
    role: z.enum(userRoles),
    /** The unit of a `mitra` account; empty for staff (and ignored for them). */
    unitId: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.role === "mitra" && !z.uuid().safeParse(value.unitId).success) {
      context.addIssue({ code: "custom", path: ["unitId"], message: "unitRequired" });
    }
  })
  .transform(({ unitId, ...value }) => ({
    ...value,
    unitId: value.role === "mitra" ? unitId : null,
  }));

export const userUpdateSchema = z.object({ id: z.uuid() }).and(userFormSchema);
export const userIdSchema = z.object({ id: z.uuid() });
export const userActiveSchema = userIdSchema.extend({ isActive: z.boolean() });

export type UserFormInput = z.input<typeof userFormSchema>;
export type UserForm = z.output<typeof userFormSchema>;

/** Where an account stands: signs in, still has to set its password, or is switched off. */
export const accountStatuses = ["active", "invited", "disabled"] as const;
export type AccountStatus = (typeof accountStatuses)[number];

/** Own profile ("Akun saya"): only the name; email and role are set by a super admin. */
export const profileFormSchema = z.object({ name: textField(2, U.nameMax) });
export type ProfileFormInput = z.input<typeof profileFormSchema>;

/** Own password change: the current password proves it is really the account owner. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "passwordRequired")
      .max(limits.auth.passwordMax, "passwordTooLong"),
  })
  .and(newPasswordSchema);
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

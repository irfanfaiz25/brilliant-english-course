"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { adminRoutes } from "@/config/admin-routes";

import { resetPassword } from "../actions";
import { newPasswordSchema, type AuthError, type NewPasswordInput } from "../schema";
import { focusOnMount, FormAlert, PasswordInput, useAuthErrorText } from "./form-parts";

/**
 * Sets a password from a link. The token is checked only by the server. `activate` is the same
 * flow for an invited account's first password (`/admin/aktivasi`), with its own wording; its
 * links come from a super admin, so an expired one is not followed by "request a new link".
 */
export function ResetPasswordForm({
  token,
  variant = "reset",
}: {
  token: string;
  variant?: "reset" | "activate";
}) {
  const t = useTranslations("Auth");
  const errorText = useAuthErrorText();
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    reValidateMode: "onSubmit",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await resetPassword({ ...values, token });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setDone(true);
    });
  });

  if (done) {
    return (
      <div
        ref={focusOnMount}
        tabIndex={-1}
        role="status"
        className="flex flex-col gap-4 outline-none"
      >
        <div className="flex items-start gap-3 rounded-xl bg-success-soft px-4 py-3">
          <CircleCheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-success-strong" />
          <div className="flex flex-col gap-1">
            <p className="text-label text-foreground">{t(`${variant}.doneTitle`)}</p>
            <p className="text-body-sm text-muted-foreground">{t(`${variant}.done`)}</p>
          </div>
        </div>
        <Button asChild pop className="w-full">
          <Link href={adminRoutes.signIn}>{t("reset.toSignIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label={t("reset.newPassword")} error={errorText(errors.password?.message)} required>
        {(control) => (
          <PasswordInput {...control} {...form.register("password")} autoComplete="new-password" />
        )}
      </Field>
      <Field
        label={t("reset.confirmPassword")}
        error={errorText(errors.confirmPassword?.message)}
        required
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register("confirmPassword")}
            autoComplete="new-password"
          />
        )}
      </Field>

      {formError && formError !== "invalid" && (
        <div className="flex flex-col gap-3">
          <FormAlert>{errorText(formError) ?? ""}</FormAlert>
          {formError === "tokenInvalid" && variant === "reset" && (
            <Button asChild variant="secondary" className="w-full">
              <Link href={adminRoutes.forgotPassword}>{t("reset.requestNew")}</Link>
            </Button>
          )}
        </div>
      )}

      <Button type="submit" pop loading={isPending} className="w-full">
        {t(`${variant}.submit`)}
      </Button>
    </form>
  );
}

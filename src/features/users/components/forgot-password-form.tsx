"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";

import { requestPasswordReset } from "../actions";
import { forgotPasswordSchema, type AuthError, type ForgotPasswordInput } from "../schema";
import { focusOnMount, FormAlert, useAuthErrorText } from "./form-parts";

/**
 * Requests a reset link. The confirmation reads the same whether or not the email has an account,
 * so the form never reveals who is on the team.
 */
export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const errorText = useAuthErrorText();
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    reValidateMode: "onSubmit",
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setSentTo(values.email.trim().toLowerCase());
    });
  });

  if (sentTo) {
    return (
      <div
        ref={focusOnMount}
        tabIndex={-1}
        role="status"
        className="flex flex-col gap-4 outline-none"
      >
        <div className="flex items-start gap-3 rounded-xl bg-success-soft px-4 py-3">
          <MailCheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-success-strong" />
          <div className="flex flex-col gap-1">
            <p className="text-label text-foreground">{t("forgot.sentTitle")}</p>
            <p className="text-body-sm text-muted-foreground">
              {t("forgot.sent", { email: sentTo, minutes: limits.auth.resetLinkMinutes })}
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" className="w-full">
          <Link href={adminRoutes.signIn}>{t("forgot.backToSignIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label={t("email")} error={errorText(form.formState.errors.email?.message)} required>
        {(control) => (
          <Input
            {...control}
            {...form.register("email")}
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder={t("emailPlaceholder")}
          />
        )}
      </Field>

      {formError && formError !== "invalid" && <FormAlert>{errorText(formError) ?? ""}</FormAlert>}

      <Button type="submit" pop loading={isPending} className="w-full">
        {t("forgot.submit")}
      </Button>
      <Link
        href={adminRoutes.signIn}
        className="self-center rounded-sm text-body-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("forgot.backToSignIn")}
      </Link>
    </form>
  );
}

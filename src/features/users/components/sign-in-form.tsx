"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { adminRoutes } from "@/config/admin-routes";

import { signIn } from "../actions";
import { signInSchema, type AuthError, type SignInInput } from "../schema";
import { FormAlert, PasswordInput, useAuthErrorText } from "./form-parts";

/** Email + password sign-in. On success the action redirects to `next` (validated server-side). */
export function SignInForm({ next }: { next: string | null }) {
  const t = useTranslations("Auth");
  const errorText = useAuthErrorText();
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    reValidateMode: "onSubmit",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn(values, next);
      // A successful sign-in redirects, so only failures come back here.
      if (result.ok) return;
      setFormError(result.error);
      for (const [name, code] of Object.entries(result.fieldErrors ?? {})) {
        if (name === "email" || name === "password") form.setError(name, { message: code });
      }
      if (result.error === "invalidCredentials") form.resetField("password");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label={t("email")} error={errorText(errors.email?.message)} required>
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
      <Field label={t("password")} error={errorText(errors.password?.message)} required>
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register("password")}
            autoComplete="current-password"
          />
        )}
      </Field>

      {formError && formError !== "invalid" && <FormAlert>{errorText(formError) ?? ""}</FormAlert>}

      <Button type="submit" pop loading={isPending} className="w-full">
        {t("signIn.submit")}
      </Button>
      <Link
        href={adminRoutes.forgotPassword}
        className="self-center rounded-sm text-body-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("signIn.forgot")}
      </Link>
    </form>
  );
}

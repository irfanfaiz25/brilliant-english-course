"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

import { changePasswordAction } from "../account-actions";
import { changePasswordSchema, type AuthError, type ChangePasswordInput } from "../schema";
import { FormAlert, PasswordInput, useAuthErrorText } from "./form-parts";

const empty: ChangePasswordInput = { currentPassword: "", password: "", confirmPassword: "" };

/**
 * Changes the own password with the current one (a session alone is not enough). Other browsers
 * are signed out; this one stays signed in. Messages come from `Auth.errors`, like sign-in.
 */
export function ChangePasswordForm() {
  const t = useTranslations("AdminAccount");
  const errorText = useAuthErrorText();
  const [formError, setFormError] = useState<AuthError | "forbidden" | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: empty,
    reValidateMode: "onSubmit",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) {
        for (const [name, code] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(name as FieldPath<ChangePasswordInput>, { message: code });
        }
        if (!result.fieldErrors) setFormError(result.error);
        return;
      }
      form.reset(empty);
      toast.success(t("passwordChanged"));
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field
        label={t("fields.currentPassword")}
        error={errorText(errors.currentPassword?.message)}
        required
        className="md:max-w-md"
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register("currentPassword")}
            autoComplete="current-password"
          />
        )}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t("fields.newPassword")} error={errorText(errors.password?.message)} required>
          {(control) => (
            <PasswordInput
              {...control}
              {...form.register("password")}
              autoComplete="new-password"
            />
          )}
        </Field>
        <Field
          label={t("fields.confirmPassword")}
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
      </div>
      {formError && formError !== "invalid" && (
        <FormAlert>{errorText(formError === "forbidden" ? "unknown" : formError) ?? ""}</FormAlert>
      )}
      <Button type="submit" loading={isPending} className="self-start">
        {t("changePassword")}
      </Button>
    </form>
  );
}

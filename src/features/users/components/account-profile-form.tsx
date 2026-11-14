"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";

import { updateProfileAction } from "../account-actions";
import { profileFormSchema, type ProfileFormInput } from "../schema";

/** "Akun saya": the own display name (shown in the top bar and on "last changed by" lines). */
export function AccountProfileForm({ defaultValues }: { defaultValues: ProfileFormInput }) {
  const t = useTranslations("AdminAccount");
  const errorText = useFormErrorText();
  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const { onSubmit, isPending } = useSaveForm(form, updateProfileAction, {
    successMessage: t("saved"),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label={t("fields.name")} error={errorText(errors.name?.message)} required>
        {(control) => (
          <Input
            {...control}
            {...form.register("name")}
            autoComplete="name"
            maxLength={limits.users.nameMax}
          />
        )}
      </Field>
      <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
    </form>
  );
}

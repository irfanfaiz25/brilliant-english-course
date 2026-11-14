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

import { renameMediaAction } from "../actions";
import { mediaRenameSchema, type MediaRename, type MediaRenameInput } from "../schema";

/** The image's library name (used for search only). */
export function MediaRenameForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: MediaRenameInput;
  canEdit: boolean;
}) {
  const t = useTranslations("AdminMedia.detail");
  const errorText = useFormErrorText();
  const form = useForm<MediaRenameInput, unknown, MediaRename>({
    resolver: zodResolver(mediaRenameSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const { onSubmit, isPending } = useSaveForm(form, renameMediaAction, {
    successMessage: t("saved"),
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-5">
        <Field label={t("name")} error={errorText(errors.name?.message)} required>
          {(control) => (
            <Input {...control} {...form.register("name")} maxLength={limits.media.nameMax} />
          )}
        </Field>
        {canEdit && (
          <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { ItemListField } from "@/components/admin/item-list-field";
import { MediaPicker } from "@/components/admin/media-picker";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { limits } from "@/config/limits";
import type { MediaOption } from "@/features/media/admin-queries";

import { updatePartnershipTraining } from "../page-actions";
import {
  partnershipTrainingSchema,
  type PartnershipTraining,
  type PartnershipTrainingInput,
} from "../page-schema";
import { IconSelect } from "./icon-select";
import { PartnershipIcon } from "./partnership-icon";

const P = limits.partnershipPage;
const blank = { title: "", text: "" };

type TrainingFormProps = {
  defaultValues: PartnershipTrainingInput;
  mediaOptions: readonly MediaOption[];
  canUploadMedia: boolean;
  canEdit: boolean;
};

/** BEC training: the lesson flow tutors learn, the training formats and a photo. */
export function TrainingForm({
  defaultValues,
  mediaOptions,
  canUploadMedia,
  canEdit,
}: TrainingFormProps) {
  const t = useTranslations("AdminPartnershipPage");
  const errorText = useFormErrorText();
  const form = useForm<PartnershipTrainingInput, unknown, PartnershipTraining>({
    resolver: zodResolver(partnershipTrainingSchema),
    defaultValues,
  });
  const formats = useWatch({ control: form.control, name: "formats" });
  const { onSubmit, isPending } = useSaveForm(form, updatePartnershipTraining);

  return (
    <form onSubmit={onSubmit} noValidate>
      <UnsavedChangesGuard when={form.formState.isDirty && !isPending} />
      <fieldset disabled={!canEdit} className="flex flex-col gap-8">
        <Controller
          control={form.control}
          name="imageId"
          render={({ field, fieldState }) => (
            <MediaPicker
              value={field.value}
              onChange={field.onChange}
              options={mediaOptions}
              canUpload={canUploadMedia}
              label={t("training.photo")}
              error={errorText(fieldState.error?.message)}
              disabled={!canEdit}
              optional
            />
          )}
        />
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-label text-foreground">{t("training.flowTitle")}</h3>
            <p className="text-body-sm text-muted-foreground">{t("training.flowHint")}</p>
          </div>
          <ItemListField
            form={form}
            name="flow"
            itemLabel={(index) => t("training.flowItem", { index })}
            addLabel={t("training.addFlow")}
            min={P.flowMin}
            max={P.flowMax}
            titleMax={P.titleMax}
            textMax={P.textMax}
            disabled={!canEdit}
            newItem={() => ({ texts: { id: blank, en: blank } })}
          />
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-label text-foreground">{t("training.formatsTitle")}</h3>
            <p className="text-body-sm text-muted-foreground">{t("training.formatsHint")}</p>
          </div>
          <ItemListField
            form={form}
            name="formats"
            itemLabel={(index) => t("training.formatItem", { index })}
            addLabel={t("training.addFormat")}
            min={1}
            max={P.formatsMax}
            titleMax={P.titleMax}
            textMax={P.textMax}
            disabled={!canEdit}
            newItem={() => ({ icon: "graduation" as const, texts: { id: blank, en: blank } })}
            renderBadge={(index) => {
              const icon = formats?.[index]?.icon;
              return icon ? (
                <PartnershipIcon name={icon} className="size-4 shrink-0 text-partner" />
              ) : null;
            }}
            renderShared={(index) => (
              <div className="max-w-md">
                <IconSelect
                  field={form.register(`formats.${index}.icon`)}
                  value={formats?.[index]?.icon}
                  label={t("fields.icon")}
                />
              </div>
            )}
          />
        </section>
        {canEdit && (
          <FormFooter
            isDirty={form.formState.isDirty}
            isPending={isPending}
            onReset={() => form.reset()}
          />
        )}
      </fieldset>
    </form>
  );
}

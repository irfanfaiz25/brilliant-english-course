"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { ItemListField } from "@/components/admin/item-list-field";
import { MediaPicker } from "@/components/admin/media-picker";
import { NativeSelect } from "@/components/admin/native-select";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";
import type { MediaOption } from "@/features/media/admin-queries";

import { updatePartnershipKit } from "../page-actions";
import {
  partnershipKitFormSchema,
  starterKitGroups,
  toInvestment,
  type PartnershipKitForm,
  type PartnershipKitFormInput,
  type PartnershipKitInput,
} from "../page-schema";
import { IconPicker, ItemIconBadge } from "./icon-picker";

const P = limits.partnershipPage;
const blank = { title: "", text: "" };

type KitFormProps = {
  defaultValues: PartnershipKitInput;
  mediaOptions: readonly MediaOption[];
  canUploadMedia: boolean;
  canEdit: boolean;
};

/** The starter kit (grouped items with an optional photo) and the starting investment. */
export function KitForm({ defaultValues, mediaOptions, canUploadMedia, canEdit }: KitFormProps) {
  const t = useTranslations("AdminPartnershipPage");
  const errorText = useFormErrorText();
  const form = useForm<PartnershipKitFormInput, unknown, PartnershipKitForm>({
    resolver: zodResolver(partnershipKitFormSchema),
    defaultValues: { ...defaultValues, investment: defaultValues.investment?.toString() ?? "" },
  });
  const items = useWatch({ control: form.control, name: "items" });
  const { onSubmit, isPending } = useSaveForm(form, updatePartnershipKit, {
    toInput: (values) => ({ ...values, investment: toInvestment(values.investment) }),
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate>
      <UnsavedChangesGuard when={form.formState.isDirty && !isPending} />
      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <Field
          label={t("kit.investment")}
          description={t("kit.investmentHint")}
          error={errorText(errors.investment?.message)}
          className="max-w-sm"
        >
          {(control) => (
            <Input
              {...control}
              {...form.register("investment")}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t("kit.investmentPlaceholder")}
            />
          )}
        </Field>
        <ItemListField
          form={form}
          name="items"
          itemLabel={(index) => t("kit.item", { index })}
          addLabel={t("kit.add")}
          min={P.kitMin}
          max={P.kitMax}
          titleMax={P.titleMax}
          textMax={P.textMax}
          disabled={!canEdit}
          newItem={() => ({
            group: "materials" as const,
            icon: "package" as const,
            iconImageId: "",
            imageId: "",
            texts: { id: blank, en: blank },
          })}
          renderBadge={(index) => (
            <ItemIconBadge
              icon={items?.[index]?.icon}
              iconImageId={items?.[index]?.iconImageId}
              mediaOptions={mediaOptions}
            />
          )}
          renderShared={(index) => (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <Field label={t("kit.group")}>
                  {(control) => (
                    <NativeSelect {...control} {...form.register(`items.${index}.group`)}>
                      {starterKitGroups.map((group) => (
                        <option key={group} value={group}>
                          {t(`groups.${group}`)}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <Controller
                  control={form.control}
                  name={`items.${index}.imageId`}
                  render={({ field, fieldState }) => (
                    <MediaPicker
                      value={field.value}
                      onChange={field.onChange}
                      options={mediaOptions}
                      canUpload={canUploadMedia}
                      label={t("fields.photo")}
                      error={errorText(fieldState.error?.message)}
                      disabled={!canEdit}
                      optional
                    />
                  )}
                />
              </div>
              <IconPicker
                control={form.control}
                iconName={`items.${index}.icon`}
                imageName={`items.${index}.iconImageId`}
                mediaOptions={mediaOptions}
                canUpload={canUploadMedia}
                disabled={!canEdit}
              />
            </div>
          )}
        />
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

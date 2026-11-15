"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { ItemListField } from "@/components/admin/item-list-field";
import { NativeSelect } from "@/components/admin/native-select";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { limits } from "@/config/limits";
import type { MediaOption } from "@/features/media/admin-queries";

import { updatePartnershipSteps } from "../page-actions";
import {
  partnerStepActions,
  partnershipStepsSchema,
  type PartnershipSteps,
  type PartnershipStepsInput,
} from "../page-schema";
import { IconPicker, ItemIconBadge } from "./icon-picker";

const P = limits.partnershipPage;
const blank = { title: "", text: "" };

/** The partnership procedure, step by step; a step may link to the quota check, form or WhatsApp. */
export function StepsForm({
  defaultValues,
  mediaOptions,
  canUploadMedia,
  canEdit,
}: {
  defaultValues: PartnershipStepsInput;
  mediaOptions: readonly MediaOption[];
  canUploadMedia: boolean;
  canEdit: boolean;
}) {
  const t = useTranslations("AdminPartnershipPage");
  const form = useForm<PartnershipStepsInput, unknown, PartnershipSteps>({
    resolver: zodResolver(partnershipStepsSchema),
    defaultValues,
  });
  const items = useWatch({ control: form.control, name: "items" });
  const { onSubmit, isPending } = useSaveForm(form, updatePartnershipSteps);

  return (
    <form onSubmit={onSubmit} noValidate>
      <UnsavedChangesGuard when={form.formState.isDirty && !isPending} />
      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <ItemListField
          form={form}
          name="items"
          itemLabel={(index) => t("steps.item", { index })}
          addLabel={t("steps.add")}
          min={P.stepsMin}
          max={P.stepsMax}
          titleMax={P.titleMax}
          textMax={P.textMax}
          disabled={!canEdit}
          newItem={() => ({
            icon: "flag" as const,
            iconImageId: "",
            action: "none" as const,
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
              <IconPicker
                control={form.control}
                iconName={`items.${index}.icon`}
                imageName={`items.${index}.iconImageId`}
                mediaOptions={mediaOptions}
                canUpload={canUploadMedia}
                disabled={!canEdit}
              />
              <Field
                label={t("steps.action")}
                description={t("steps.actionHint")}
                className="max-w-md"
              >
                {(control) => (
                  <NativeSelect {...control} {...form.register(`items.${index}.action`)}>
                    {partnerStepActions.map((action) => (
                      <option key={action} value={action}>
                        {t(`actions.${action}`)}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
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

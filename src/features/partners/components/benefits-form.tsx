"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { ItemListField } from "@/components/admin/item-list-field";
import { PublishedCheckbox } from "@/components/admin/published-checkbox";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useSaveForm } from "@/components/admin/use-save-form";
import { limits } from "@/config/limits";

import { updatePartnershipBenefits } from "../page-actions";
import {
  partnershipBenefitsSchema,
  type PartnershipBenefits,
  type PartnershipBenefitsInput,
} from "../page-schema";
import { IconSelect } from "./icon-select";
import { PartnershipIcon } from "./partnership-icon";

const P = limits.partnershipPage;
const blank = { title: "", text: "" };

/** Why join BEC: the benefit cards; `featured` ones are large and also lead the hero. */
export function BenefitsForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: PartnershipBenefitsInput;
  canEdit: boolean;
}) {
  const t = useTranslations("AdminPartnershipPage");
  const form = useForm<PartnershipBenefitsInput, unknown, PartnershipBenefits>({
    resolver: zodResolver(partnershipBenefitsSchema),
    defaultValues,
  });
  const items = useWatch({ control: form.control, name: "items" });
  const { onSubmit, isPending } = useSaveForm(form, updatePartnershipBenefits);

  return (
    <form onSubmit={onSubmit} noValidate>
      <UnsavedChangesGuard when={form.formState.isDirty && !isPending} />
      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <ItemListField
          form={form}
          name="items"
          itemLabel={(index) => t("benefits.item", { index })}
          addLabel={t("benefits.add")}
          min={P.benefitsMin}
          max={P.benefitsMax}
          titleMax={P.titleMax}
          textMax={P.textMax}
          disabled={!canEdit}
          newItem={() => ({
            icon: "sparkles" as const,
            featured: false,
            texts: { id: blank, en: blank },
          })}
          renderBadge={(index) => {
            const icon = items?.[index]?.icon;
            return icon ? (
              <PartnershipIcon name={icon} className="size-4 shrink-0 text-partner" />
            ) : null;
          }}
          renderShared={(index) => (
            <div className="grid gap-4 md:grid-cols-2 md:items-end">
              <IconSelect
                field={form.register(`items.${index}.icon`)}
                value={items?.[index]?.icon}
                label={t("fields.icon")}
              />
              <PublishedCheckbox
                label={t("benefits.featured")}
                hint={t("benefits.featuredHint")}
                {...form.register(`items.${index}.featured`)}
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

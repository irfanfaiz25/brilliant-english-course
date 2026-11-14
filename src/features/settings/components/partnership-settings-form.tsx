"use client";

import { useTranslations } from "next-intl";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { StringListField } from "@/components/admin/string-list-field";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";
import { partnershipSettingSchema } from "@/features/partners/schema";
import { routing } from "@/i18n/routing";

import { updatePartnershipSettings } from "../actions";
import {
  partnershipFieldName,
  toPartnershipFormErrors,
  toPartnershipSetting,
  type PartnershipFormValues,
} from "../partnership-form";

/** Validates with the setting's own schema, so the browser and the action agree. */
const resolver: Resolver<PartnershipFormValues> = async (values) => {
  const parsed = partnershipSettingSchema.safeParse(toPartnershipSetting(values));
  if (parsed.success) return { values, errors: {} };
  return {
    values: {},
    errors: toPartnershipFormErrors(parsed.error.issues) as FieldErrors<PartnershipFormValues>,
  };
};

type PartnershipSettingsFormProps = {
  defaultValues: PartnershipFormValues;
  canEdit: boolean;
};

/** The partnership package on Kemitraan: one investment, the inclusions in every locale. */
export function PartnershipSettingsForm({ defaultValues, canEdit }: PartnershipSettingsFormProps) {
  const t = useTranslations("AdminSettings.partnership");
  const tLocales = useTranslations("AdminSettings.locales");
  const errorText = useFormErrorText();
  const form = useForm<PartnershipFormValues>({ resolver, defaultValues });
  const { errors, isDirty } = form.formState;
  const { onSubmit, isPending } = useSaveForm(form, updatePartnershipSettings, {
    toInput: toPartnershipSetting,
    toFieldName: partnershipFieldName,
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-8">
        <Field
          label={t("investment")}
          description={t("investmentHint")}
          error={errorText(errors.investment?.message)}
          className="sm:max-w-sm"
        >
          {(control) => (
            <Input
              {...control}
              {...form.register("investment")}
              inputMode="numeric"
              autoComplete="off"
              placeholder="150000000"
            />
          )}
        </Field>

        <div className="flex flex-col gap-2">
          <h3 className="text-h5 text-foreground">{t("inclusions")}</h3>
          <p className="text-body-sm text-muted-foreground">
            {t("inclusionsHint", {
              min: limits.settings.inclusionsMin,
              max: limits.settings.inclusionsMax,
            })}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {routing.locales.map((locale) => (
            <div
              key={locale}
              lang={locale}
              className="rounded-xl border border-border/70 bg-background/60 p-4"
            >
              <StringListField
                form={form}
                name={`inclusions.${locale}`}
                label={tLocales(locale)}
                itemLabel={(index) => t("inclusionLabel", { index })}
                addLabel={t("addInclusion")}
                min={limits.settings.inclusionsMin}
                max={limits.settings.inclusionsMax}
                maxLength={limits.settings.inclusionMax}
              />
            </div>
          ))}
        </div>

        {canEdit && (
          <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}

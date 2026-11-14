"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";
import { partnershipSettingSchema } from "@/features/partners/schema";
import { routing, type Locale } from "@/i18n/routing";

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
            <InclusionList key={locale} form={form} locale={locale} />
          ))}
        </div>

        {canEdit && (
          <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}

function InclusionList({
  form,
  locale,
}: {
  form: UseFormReturn<PartnershipFormValues>;
  locale: Locale;
}) {
  const t = useTranslations("AdminSettings");
  const errorText = useFormErrorText();
  const rows = useFieldArray({ control: form.control, name: `inclusions.${locale}` });
  const errors = form.formState.errors.inclusions?.[locale];

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <legend className="px-1 text-label text-foreground">{t(`locales.${locale}`)}</legend>
      <ol className="flex flex-col gap-3">
        {rows.fields.map((row, index) => {
          const message = errorText(errors?.[index]?.value?.message);
          const errorId = `inclusion-${locale}-${index}-error`;
          return (
            <li key={row.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Input
                  {...form.register(`inclusions.${locale}.${index}.value`)}
                  lang={locale}
                  aria-label={t("partnership.inclusionLabel", { index: index + 1 })}
                  aria-invalid={message ? true : undefined}
                  aria-describedby={message ? errorId : undefined}
                  maxLength={limits.settings.inclusionMax}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => rows.remove(index)}
                  disabled={rows.fields.length <= limits.settings.inclusionsMin}
                  aria-label={t("partnership.removeInclusion", { index: index + 1 })}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
              {message && (
                <p
                  id={errorId}
                  role="alert"
                  className="text-body-sm font-medium text-destructive-strong"
                >
                  {message}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {errors?.root?.message && (
        <p role="alert" className="text-body-sm font-medium text-destructive-strong">
          {errorText(errors.root.message)}
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={rows.fields.length >= limits.settings.inclusionsMax}
        onClick={() => rows.append({ value: "" })}
      >
        <PlusIcon aria-hidden />
        {t("partnership.addInclusion")}
      </Button>
    </fieldset>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { CharacterCount, FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";
import { routing } from "@/i18n/routing";

import { updateSeoDefaults } from "../actions";
import { seoDefaultsSchema, type SeoDefaults, type SeoDefaultsInput } from "../schema";

type SeoDefaultsFormProps = { defaultValues: SeoDefaultsInput; canEdit: boolean };

/** The site-wide description in every locale (the `seo` setting). */
export function SeoDefaultsForm({ defaultValues, canEdit }: SeoDefaultsFormProps) {
  const t = useTranslations("AdminSeo.defaults");
  const tLocales = useTranslations("AdminSettings.locales");
  const errorText = useFormErrorText();
  const form = useForm<SeoDefaultsInput, unknown, SeoDefaults>({
    resolver: zodResolver(seoDefaultsSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const descriptions = useWatch({ control: form.control, name: "description" });
  const { onSubmit, isPending } = useSaveForm(form, updateSeoDefaults);

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {routing.locales.map((locale) => (
            <Field
              key={locale}
              label={t("field", { locale: tLocales(locale) })}
              description={
                <CharacterCount
                  count={descriptions[locale].trim().length}
                  max={limits.seo.descriptionMax}
                />
              }
              error={errorText(errors.description?.[locale]?.message)}
              required
            >
              {(control) => (
                <Textarea
                  {...control}
                  {...form.register(`description.${locale}`)}
                  lang={locale}
                  rows={3}
                />
              )}
            </Field>
          ))}
        </div>
        {canEdit && (
          <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}

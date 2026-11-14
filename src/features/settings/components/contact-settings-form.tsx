"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { WeekdayPicker } from "@/components/admin/weekday-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";
import { socialNetworkNames, socialNetworks } from "@/config/site";

import { updateContactSettings } from "../actions";
import { contactSettingsSchema, type ContactSettings, type ContactSettingsInput } from "../schema";

type ContactSettingsFormProps = {
  defaultValues: ContactSettingsInput;
  /** Read-only for roles that may view but not change settings. */
  canEdit: boolean;
};

/** Head-office contact details, office hours and social links (the `contact` setting). */
export function ContactSettingsForm({ defaultValues, canEdit }: ContactSettingsFormProps) {
  const t = useTranslations("AdminSettings.contact");
  const errorText = useFormErrorText();
  const form = useForm<ContactSettingsInput, unknown, ContactSettings>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const hours = useFieldArray({ control: form.control, name: "officeHours" });
  const { onSubmit, isPending } = useSaveForm(form, updateContactSettings);
  const hoursError = errors.officeHours?.root?.message ?? errors.officeHours?.message;

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("whatsapp")}
            description={t("whatsappHint")}
            error={errorText(errors.whatsapp?.message)}
            required
          >
            {(control) => (
              <Input
                {...control}
                {...form.register("whatsapp")}
                type="tel"
                inputMode="tel"
                autoComplete="off"
              />
            )}
          </Field>
          <Field label={t("email")} error={errorText(errors.email?.message)} required>
            {(control) => (
              <Input {...control} {...form.register("email")} type="email" autoComplete="off" />
            )}
          </Field>
          <Field
            label={t("address")}
            error={errorText(errors.address?.message)}
            required
            className="sm:col-span-2"
          >
            {(control) => (
              <Textarea
                {...control}
                {...form.register("address")}
                rows={2}
                maxLength={limits.settings.addressMax}
                className="min-h-20"
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1 text-h5 text-foreground">{t("hoursTitle")}</legend>
          <div className="flex flex-col gap-4">
            <p className="text-body-sm text-muted-foreground">{t("hoursDescription")}</p>
            <ul className="flex flex-col gap-3">
              {hours.fields.map((row, index) => {
                const rowErrors = errors.officeHours?.[index];
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background/60 p-4 md:flex-row md:items-start"
                  >
                    <Controller
                      control={form.control}
                      name={`officeHours.${index}.days`}
                      render={({ field }) => (
                        <WeekdayPicker
                          value={field.value}
                          onChange={field.onChange}
                          label={t("days")}
                        />
                      )}
                    />
                    <div className="grid flex-1 grid-cols-2 gap-3 md:max-w-72">
                      <Field label={t("opens")} error={errorText(rowErrors?.opens?.message)}>
                        {(control) => (
                          <Input
                            {...control}
                            {...form.register(`officeHours.${index}.opens`)}
                            type="time"
                          />
                        )}
                      </Field>
                      <Field label={t("closes")} error={errorText(rowErrors?.closes?.message)}>
                        {(control) => (
                          <Input
                            {...control}
                            {...form.register(`officeHours.${index}.closes`)}
                            type="time"
                          />
                        )}
                      </Field>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => hours.remove(index)}
                      disabled={hours.fields.length <= 1}
                      aria-label={t("removeHours", { index: index + 1 })}
                      className="self-end md:mt-8 md:self-start"
                    >
                      <Trash2Icon aria-hidden />
                    </Button>
                    {rowErrors?.days?.message && (
                      <p role="alert" className="text-body-sm font-medium text-destructive-strong">
                        {errorText(rowErrors.days.message)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {hoursError && (
              <p role="alert" className="text-body-sm font-medium text-destructive-strong">
                {errorText(hoursError)}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={hours.fields.length >= limits.settings.officeHoursMax}
              onClick={() => hours.append({ days: [], opens: "08:00", closes: "17:00" })}
            >
              <PlusIcon aria-hidden />
              {t("addHours")}
            </Button>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-h5 text-foreground">{t("socialTitle")}</legend>
          <div className="flex flex-col gap-4">
            <p className="text-body-sm text-muted-foreground">{t("socialDescription")}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {socialNetworks.map((network) => (
                <Field
                  key={network}
                  label={socialNetworkNames[network]}
                  error={errorText(errors.social?.[network]?.message)}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register(`social.${network}`)}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>
        </fieldset>

        {canEdit && (
          <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}

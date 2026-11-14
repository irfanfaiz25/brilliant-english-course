"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { PublishedCheckbox } from "@/components/admin/published-checkbox";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useLocaleTabs } from "@/components/admin/use-locale-tabs";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import type { MediaOption } from "@/features/media/admin-queries";

import { createActivityAction, updateActivityAction } from "../actions";
import {
  activityFormSchema,
  type ActivityForm as ActivityFormOutput,
  type ActivityFormInput,
} from "../schema";

const A = limits.activities;

type ActivityFormProps = {
  /** The activity being edited; absent when adding a new one. */
  id?: string;
  defaultValues: ActivityFormInput;
  mediaOptions: readonly MediaOption[];
  canPublish: boolean;
};

/** Add or edit an activity: photo, visibility and bilingual copy. */
export function ActivityForm({ id, defaultValues, mediaOptions, canPublish }: ActivityFormProps) {
  const t = useTranslations("AdminActivities");
  const errorText = useFormErrorText();
  const router = useRouter();
  const form = useForm<ActivityFormInput, unknown, ActivityFormOutput>({
    resolver: zodResolver(activityFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const tabs = useLocaleTabs(errors);
  const { onSubmit, isPending } = useSaveForm(
    form,
    id ? updateActivityAction : createActivityAction,
    {
      toInput: (values) => (id ? { ...values, id } : values),
      onInvalid: tabs.showInvalid,
      // A new activity goes back to the list, where it appears at the end.
      onSaved: id ? undefined : () => router.push(adminRoutes.activities),
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <AdminPanel title={t("sections.photo.title")} description={t("sections.photo.description")}>
          <Controller
            control={form.control}
            name="imageId"
            render={({ field, fieldState }) => (
              <MediaPicker
                value={field.value}
                onChange={field.onChange}
                options={mediaOptions}
                label={t("fields.image")}
                error={errorText(fieldState.error?.message)}
              />
            )}
          />
          {canPublish && (
            <PublishedCheckbox
              label={t("fields.isPublished")}
              hint={t("fields.isPublishedHint")}
              {...form.register("isPublished")}
            />
          )}
        </AdminPanel>

        <AdminPanel
          title={t("sections.content.title")}
          description={t("sections.content.description")}
        >
          <LocaleTabs value={tabs.locale} onValueChange={tabs.setLocale} invalid={tabs.invalid}>
            {(locale) => {
              const text = errors.texts?.[locale];
              return (
                <>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label={t("fields.name")} error={errorText(text?.name?.message)} required>
                      {(control) => (
                        <Input
                          {...control}
                          {...form.register(`texts.${locale}.name`)}
                          maxLength={A.nameMax}
                        />
                      )}
                    </Field>
                    <Field
                      label={t("fields.audience")}
                      description={t("fields.audienceHint")}
                      error={errorText(text?.audience?.message)}
                      required
                    >
                      {(control) => (
                        <Input
                          {...control}
                          {...form.register(`texts.${locale}.audience`)}
                          maxLength={A.audienceMax}
                        />
                      )}
                    </Field>
                  </div>
                  <Field
                    label={t("fields.summary")}
                    error={errorText(text?.summary?.message)}
                    required
                  >
                    {(control) => (
                      <Textarea
                        {...control}
                        {...form.register(`texts.${locale}.summary`)}
                        rows={3}
                        maxLength={A.summaryMax}
                      />
                    )}
                  </Field>
                  <Field
                    label={t("fields.imageAlt")}
                    description={t("fields.imageAltHint")}
                    error={errorText(text?.imageAlt?.message)}
                    required
                  >
                    {(control) => (
                      <Input
                        {...control}
                        {...form.register(`texts.${locale}.imageAlt`)}
                        maxLength={limits.imageAltMax}
                      />
                    )}
                  </Field>
                </>
              );
            }}
          </LocaleTabs>
        </AdminPanel>
      </div>

      <FormFooter
        sticky
        saveWhenClean={!id}
        saveLabel={id ? undefined : t("add")}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => form.reset()}
      />
    </form>
  );
}

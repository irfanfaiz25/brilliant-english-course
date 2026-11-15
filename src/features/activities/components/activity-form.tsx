"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { PhotoListField } from "@/components/admin/photo-list-field";
import { StringListField } from "@/components/admin/string-list-field";
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
import { ActivityCardPreview, type ActivityCardLabels } from "./activity-card-preview";
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
  /** Shows "upload a new image" in the picker (`media` create permission). */
  canUploadMedia: boolean;
  canPublish: boolean;
  /** Card labels for the live preview, in every locale. */
  previewLabels: ActivityCardLabels;
};

/** Add or edit an activity: photo, visibility, bilingual card copy and the popup details. */
export function ActivityForm({
  id,
  defaultValues,
  mediaOptions,
  canUploadMedia,
  canPublish,
  previewLabels,
}: ActivityFormProps) {
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
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ActivityCardPreview
          control={form.control}
          locale={tabs.locale}
          labels={previewLabels}
          mediaOptions={mediaOptions}
          className="xl:order-last"
        />
        <div className="flex min-w-0 flex-col gap-6">
          <AdminPanel
            title={t("sections.photo.title")}
            description={t("sections.photo.description")}
          >
            <Controller
              control={form.control}
              name="imageId"
              render={({ field, fieldState }) => (
                <MediaPicker
                  value={field.value}
                  onChange={field.onChange}
                  options={mediaOptions}
                  canUpload={canUploadMedia}
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
                      <Field
                        label={t("fields.name")}
                        error={errorText(text?.name?.message)}
                        required
                      >
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

          <AdminPanel
            title={t("sections.details.title")}
            description={t("sections.details.description")}
          >
            <LocaleTabs value={tabs.locale} onValueChange={tabs.setLocale} invalid={tabs.invalid}>
              {(locale) => {
                const text = errors.texts?.[locale];
                return (
                  <>
                    <Field
                      label={t("fields.description")}
                      description={t("fields.descriptionHint")}
                      error={errorText(text?.description?.message)}
                    >
                      {(control) => (
                        <Textarea
                          {...control}
                          {...form.register(`texts.${locale}.description`)}
                          rows={4}
                          maxLength={A.descriptionMax}
                        />
                      )}
                    </Field>
                    <Field
                      label={t("fields.schedule")}
                      description={t("fields.scheduleHint")}
                      error={errorText(text?.schedule?.message)}
                      className="max-w-md"
                    >
                      {(control) => (
                        <Input
                          {...control}
                          {...form.register(`texts.${locale}.schedule`)}
                          maxLength={A.scheduleMax}
                        />
                      )}
                    </Field>
                    <div className="grid items-start gap-6 lg:grid-cols-2">
                      <StringListField
                        form={form}
                        name={`texts.${locale}.highlights`}
                        label={t("fields.highlights")}
                        description={t("fields.highlightsHint")}
                        itemLabel={(index) => t("fields.highlightLabel", { index })}
                        addLabel={t("fields.addHighlight")}
                        min={0}
                        max={A.highlightsMax}
                        maxLength={A.highlightMax}
                      />
                      <StringListField
                        form={form}
                        name={`texts.${locale}.skills`}
                        label={t("fields.skills")}
                        description={t("fields.skillsHint")}
                        itemLabel={(index) => t("fields.skillLabel", { index })}
                        addLabel={t("fields.addSkill")}
                        min={0}
                        max={A.skillsMax}
                        maxLength={A.skillMax}
                      />
                    </div>
                  </>
                );
              }}
            </LocaleTabs>
          </AdminPanel>

          <AdminPanel
            title={t("sections.photos.title")}
            description={t("sections.photos.description")}
          >
            <PhotoListField
              form={form}
              name="photos"
              mediaOptions={mediaOptions}
              canUpload={canUploadMedia}
              max={A.photosMax}
              captionMax={A.captionMax}
            />
          </AdminPanel>
        </div>
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

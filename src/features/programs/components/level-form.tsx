"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { PublishedCheckbox } from "@/components/admin/published-checkbox";
import { StringListField } from "@/components/admin/string-list-field";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useLocaleTabs } from "@/components/admin/use-locale-tabs";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";
import type { MediaOption } from "@/features/media/admin-queries";

import { updateLevelAction } from "../actions";
import { LevelCardPreview, type LevelCardLabels } from "./level-card-preview";
import { levelFormSchema, type LevelForm as LevelFormOutput, type LevelFormInput } from "../schema";

const L = limits.programs;

type LevelFormProps = {
  defaultValues: LevelFormInput;
  mediaOptions: readonly MediaOption[];
  canEdit: boolean;
  /** Only publishers see the visibility checkbox (the switch on the list does the same). */
  canPublish: boolean;
  /** Card labels for the live preview, in every locale. */
  previewLabels: LevelCardLabels;
};

/** A program level: class details, photo and bilingual copy, saved together. */
export function LevelForm({
  defaultValues,
  mediaOptions,
  canEdit,
  canPublish,
  previewLabels,
}: LevelFormProps) {
  const t = useTranslations("AdminPrograms");
  const errorText = useFormErrorText();
  const form = useForm<LevelFormInput, unknown, LevelFormOutput>({
    resolver: zodResolver(levelFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const tabs = useLocaleTabs(errors);
  const { onSubmit, isPending } = useSaveForm(form, updateLevelAction, {
    onInvalid: tabs.showInvalid,
  });
  const number = { valueAsNumber: true } as const;

  return (
    <form onSubmit={onSubmit} noValidate>
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AdminPanel
            title={t("sections.details.title")}
            description={t("sections.details.description")}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("fields.ageMin")} error={errorText(errors.ageMin?.message)} required>
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("ageMin", number)}
                    type="number"
                    inputMode="numeric"
                    min={L.ageMin}
                    max={L.ageMax}
                  />
                )}
              </Field>
              <Field label={t("fields.ageMax")} error={errorText(errors.ageMax?.message)} required>
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("ageMax", number)}
                    type="number"
                    inputMode="numeric"
                    min={L.ageMin}
                    max={L.ageMax}
                  />
                )}
              </Field>
              <Field
                label={t("fields.sessionsPerWeek")}
                error={errorText(errors.sessionsPerWeek?.message)}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("sessionsPerWeek", number)}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={L.sessionsPerWeekMax}
                  />
                )}
              </Field>
              <Field
                label={t("fields.maxStudentsPerClass")}
                error={errorText(errors.maxStudentsPerClass?.message)}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("maxStudentsPerClass", number)}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={L.studentsPerClassMax}
                  />
                )}
              </Field>
            </div>
            {canPublish && (
              <PublishedCheckbox
                label={t("fields.isPublished")}
                hint={t("fields.isPublishedHint")}
                {...form.register("isPublished")}
              />
            )}
          </AdminPanel>

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
                  label={t("fields.image")}
                  error={errorText(fieldState.error?.message)}
                  disabled={!canEdit}
                />
              )}
            />
          </AdminPanel>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <LevelCardPreview
            control={form.control}
            locale={tabs.locale}
            labels={previewLabels}
            mediaOptions={mediaOptions}
            className="xl:order-last"
          />
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
                            maxLength={L.nameMax}
                          />
                        )}
                      </Field>
                      <Field
                        label={t("fields.tagline")}
                        error={errorText(text?.tagline?.message)}
                        required
                      >
                        {(control) => (
                          <Input
                            {...control}
                            {...form.register(`texts.${locale}.tagline`)}
                            maxLength={L.taglineMax}
                          />
                        )}
                      </Field>
                    </div>
                    <Field
                      label={t("fields.summary")}
                      description={t("fields.summaryHint")}
                      error={errorText(text?.summary?.message)}
                      required
                    >
                      {(control) => (
                        <Textarea
                          {...control}
                          {...form.register(`texts.${locale}.summary`)}
                          rows={2}
                          maxLength={L.summaryMax}
                          className="min-h-20"
                        />
                      )}
                    </Field>
                    <Field
                      label={t("fields.description")}
                      description={t("fields.descriptionHint")}
                      error={errorText(text?.description?.message)}
                      required
                    >
                      {(control) => (
                        <Textarea
                          {...control}
                          {...form.register(`texts.${locale}.description`)}
                          rows={4}
                          maxLength={L.descriptionMax}
                        />
                      )}
                    </Field>
                    <div className="grid items-start gap-6 lg:grid-cols-2">
                      <StringListField
                        form={form}
                        name={`texts.${locale}.skills`}
                        label={t("fields.skills")}
                        description={t("fields.skillsHint")}
                        itemLabel={(index) => t("fields.skillLabel", { index })}
                        addLabel={t("fields.addSkill")}
                        min={1}
                        max={L.skillsMax}
                        maxLength={L.skillMax}
                      />
                      <StringListField
                        form={form}
                        name={`texts.${locale}.curriculum`}
                        label={t("fields.curriculum")}
                        description={t("fields.curriculumHint")}
                        itemLabel={(index) => t("fields.curriculumLabel", { index })}
                        addLabel={t("fields.addCurriculum")}
                        min={1}
                        max={L.curriculumMax}
                        maxLength={L.curriculumItemMax}
                      />
                    </div>
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

        {canEdit && (
          <FormFooter sticky isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}

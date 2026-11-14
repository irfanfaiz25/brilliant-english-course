"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { NativeSelect } from "@/components/admin/native-select";
import { PublishedCheckbox } from "@/components/admin/published-checkbox";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useLocaleTabs } from "@/components/admin/use-locale-tabs";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";

import { createTestimonialAction, updateTestimonialAction } from "../actions";
import { testimonialListHref } from "../list-href";
import {
  testimonialAudiences,
  testimonialFormSchema,
  type TestimonialForm as TestimonialFormOutput,
  type TestimonialFormInput,
} from "../schema";
import { RatingField } from "./rating-field";
import { TestimonialCardPreview } from "./testimonial-card-preview";

const T = limits.testimonials;

type TestimonialFormProps = {
  /** The testimonial being edited; absent when adding a new one. */
  id?: string;
  defaultValues: TestimonialFormInput;
  canPublish: boolean;
};

/** Add or edit a testimonial: who said it, the group and rating, and the bilingual quote. */
export function TestimonialForm({ id, defaultValues, canPublish }: TestimonialFormProps) {
  const t = useTranslations("AdminTestimonials");
  const errorText = useFormErrorText();
  const router = useRouter();
  const form = useForm<TestimonialFormInput, unknown, TestimonialFormOutput>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const tabs = useLocaleTabs(errors);
  const { onSubmit, isPending } = useSaveForm(
    form,
    id ? updateTestimonialAction : createTestimonialAction,
    {
      toInput: (values) => (id ? { ...values, id } : values),
      onInvalid: tabs.showInvalid,
      // A new testimonial goes back to its group's list, where it appears at the end.
      onSaved: id ? undefined : () => router.push(testimonialListHref(form.getValues("audience"))),
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <TestimonialCardPreview
          control={form.control}
          locale={tabs.locale}
          className="xl:order-last"
        />
        <div className="flex min-w-0 flex-col gap-6">
          <AdminPanel
            title={t("sections.about.title")}
            description={t("sections.about.description")}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label={t("fields.authorName")}
                description={t("fields.authorNameHint")}
                error={errorText(errors.authorName?.message)}
                required
              >
                {(control) => (
                  <Input {...control} {...form.register("authorName")} maxLength={T.authorMax} />
                )}
              </Field>
              <Field
                label={t("fields.audience")}
                description={t("fields.audienceHint")}
                error={errorText(errors.audience?.message)}
                required
              >
                {(control) => (
                  <NativeSelect {...control} {...form.register("audience")}>
                    {testimonialAudiences.map((audience) => (
                      <option key={audience} value={audience}>
                        {t(`audiences.${audience}`)}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </div>
            <Controller
              control={form.control}
              name="rating"
              render={({ field, fieldState }) => (
                <RatingField
                  value={field.value}
                  onChange={field.onChange}
                  label={t("fields.rating")}
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
                    <Field
                      label={t("fields.quote")}
                      description={t("fields.quoteHint")}
                      error={errorText(text?.quote?.message)}
                      required
                    >
                      {(control) => (
                        <Textarea
                          {...control}
                          {...form.register(`texts.${locale}.quote`)}
                          rows={5}
                          maxLength={T.quoteMax}
                        />
                      )}
                    </Field>
                    <Field
                      label={t("fields.role")}
                      description={t("fields.roleHint")}
                      error={errorText(text?.role?.message)}
                      required
                    >
                      {(control) => (
                        <Input
                          {...control}
                          {...form.register(`texts.${locale}.role`)}
                          maxLength={T.roleMax}
                        />
                      )}
                    </Field>
                  </>
                );
              }}
            </LocaleTabs>
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

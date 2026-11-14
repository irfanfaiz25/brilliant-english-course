"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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

import { createFaqItemAction, updateFaqItemAction } from "../actions";
import { faqListHref } from "../list-href";
import {
  faqFormSchema,
  faqTopics,
  type FaqForm as FaqFormOutput,
  type FaqFormInput,
} from "../schema";

const F = limits.faq;

type FaqFormProps = {
  /** The entry being edited; absent when adding a new one. */
  id?: string;
  defaultValues: FaqFormInput;
  canPublish: boolean;
};

/** Add or edit an FAQ entry: its topic (the page it shows on) and the bilingual question/answer. */
export function FaqForm({ id, defaultValues, canPublish }: FaqFormProps) {
  const t = useTranslations("AdminFaq");
  const errorText = useFormErrorText();
  const router = useRouter();
  const form = useForm<FaqFormInput, unknown, FaqFormOutput>({
    resolver: zodResolver(faqFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const tabs = useLocaleTabs(errors);
  const { onSubmit, isPending } = useSaveForm(
    form,
    id ? updateFaqItemAction : createFaqItemAction,
    {
      toInput: (values) => (id ? { ...values, id } : values),
      onInvalid: tabs.showInvalid,
      // A new entry goes back to its topic's list, where it appears at the end.
      onSaved: id ? undefined : () => router.push(faqListHref(form.getValues("topic"))),
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <AdminPanel title={t("sections.topic.title")} description={t("sections.topic.description")}>
        <Field
          label={t("fields.topic")}
          description={t("fields.topicHint")}
          error={errorText(errors.topic?.message)}
          required
          className="md:max-w-sm"
        >
          {(control) => (
            <NativeSelect {...control} {...form.register("topic")}>
              {faqTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {t(`topics.${topic}`)} · {t(`placements.${topic}`)}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
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
                  label={t("fields.question")}
                  description={t("fields.questionHint")}
                  error={errorText(text?.question?.message)}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register(`texts.${locale}.question`)}
                      maxLength={F.questionMax}
                    />
                  )}
                </Field>
                <Field
                  label={t("fields.answer")}
                  description={t("fields.answerHint")}
                  error={errorText(text?.answer?.message)}
                  required
                >
                  {(control) => (
                    <Textarea
                      {...control}
                      {...form.register(`texts.${locale}.answer`)}
                      rows={6}
                      maxLength={F.answerMax}
                    />
                  )}
                </Field>
              </>
            );
          }}
        </LocaleTabs>
      </AdminPanel>

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

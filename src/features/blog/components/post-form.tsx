"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, EraserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { NativeSelect } from "@/components/admin/native-select";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useLocaleTabs } from "@/components/admin/use-locale-tabs";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import type { MediaOption } from "@/features/media/admin-queries";
import type { Locale } from "@/i18n/routing";
import { slugify } from "@/lib/slug";

import { createPostAction, updatePostAction } from "../actions";
import {
  emptyPostText,
  postCategories,
  postFormSchema,
  postStatuses,
  type PostCategory,
  type PostForm as PostFormOutput,
  type PostFormInput,
} from "../schema";
import { RichTextEditor } from "./editor/rich-text-editor";

const B = limits.blog;

type PostFormProps = {
  /** The post being edited; absent for a new one. */
  id?: string;
  defaultValues: PostFormInput;
  /** Category names (`Blog.categories`), passed from the server. */
  categoryLabels: Record<PostCategory, string>;
  mediaOptions: readonly MediaOption[];
  canUseLibrary: boolean;
  canUploadMedia: boolean;
  /** `publish` on blog: may publish and archive (others keep drafts). */
  canPublish: boolean;
  /** The live article per language, once it is published. */
  siteHrefs?: Partial<Record<Locale, string>>;
};

/** Write or edit an article: content per language, publishing and details (DESIGN.md § 6). */
export function PostForm({
  id,
  defaultValues,
  categoryLabels,
  mediaOptions,
  canUseLibrary,
  canUploadMedia,
  canPublish,
  siteHrefs = {},
}: PostFormProps) {
  const t = useTranslations("AdminBlog");
  const errorText = useFormErrorText();
  const router = useRouter();
  const form = useForm<PostFormInput, unknown, PostFormOutput>({
    resolver: zodResolver(postFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const tabs = useLocaleTabs(errors);
  // A slug follows its title until it is edited (new posts, and an unwritten English version).
  const [slugFollows, setSlugFollows] = useState<Record<Locale, boolean>>({
    id: !id,
    en: !id || !defaultValues.texts.en.slug,
  });
  // Editors read their value once: clearing English or resetting the form remounts them.
  const [editorVersion, setEditorVersion] = useState(0);

  const { onSubmit, isPending } = useSaveForm(form, id ? updatePostAction : createPostAction, {
    toInput: (values) => (id ? { ...values, id } : values),
    onInvalid: tabs.showInvalid,
    successMessage: t("saved"),
    onSaved: id
      ? undefined
      : (data) => router.push(`${adminRoutes.blog}/${(data as { id: string }).id}`),
  });

  const clearEnglish = () => {
    form.setValue("texts.en", emptyPostText(), { shouldDirty: true });
    form.clearErrors("texts.en");
    setSlugFollows((current) => ({ ...current, en: true }));
    setEditorVersion((version) => version + 1);
  };

  const publishLabel = (status: PostFormInput["status"]) => t(`status.${status}`);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <AdminPanel
          title={t("sections.content.title")}
          description={t("sections.content.description")}
          className="min-w-0"
        >
          <LocaleTabs value={tabs.locale} onValueChange={tabs.setLocale} invalid={tabs.invalid}>
            {(locale) => {
              const text = errors.texts?.[locale];
              const contentError = errorText(text?.content?.message);
              return (
                <>
                  {locale === "en" && (
                    <div className="flex flex-col gap-3 rounded-xl bg-info-soft px-4 py-3 text-body-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
                      <p>{t("fields.englishOptional")}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={clearEnglish}
                      >
                        <EraserIcon aria-hidden />
                        {t("fields.englishClear")}
                      </Button>
                    </div>
                  )}
                  <Field
                    label={t("fields.title")}
                    error={errorText(text?.title?.message)}
                    required={locale === "id"}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        {...form.register(`texts.${locale}.title`, {
                          onChange: (event: { target: { value: string } }) => {
                            if (slugFollows[locale]) {
                              form.setValue(
                                `texts.${locale}.slug`,
                                slugify(event.target.value).slice(0, B.slugMax),
                                { shouldDirty: true },
                              );
                            }
                          },
                        })}
                        maxLength={B.titleMax}
                      />
                    )}
                  </Field>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label={t("fields.slug")}
                      description={t("fields.slugHint")}
                      error={errorText(text?.slug?.message)}
                      required={locale === "id"}
                    >
                      {(control) => (
                        <Input
                          {...control}
                          {...form.register(`texts.${locale}.slug`, {
                            onChange: () =>
                              setSlugFollows((current) => ({ ...current, [locale]: false })),
                          })}
                          maxLength={B.slugMax}
                          spellCheck={false}
                          autoCapitalize="off"
                        />
                      )}
                    </Field>
                    <Field
                      label={t("fields.coverAlt")}
                      description={t("fields.coverAltHint")}
                      error={errorText(text?.coverAlt?.message)}
                      required={locale === "id"}
                    >
                      {(control) => (
                        <Input
                          {...control}
                          {...form.register(`texts.${locale}.coverAlt`)}
                          maxLength={limits.imageAltMax}
                        />
                      )}
                    </Field>
                  </div>
                  <Field
                    label={t("fields.excerpt")}
                    description={t("fields.excerptHint")}
                    error={errorText(text?.excerpt?.message)}
                    required={locale === "id"}
                  >
                    {(control) => (
                      <Textarea
                        {...control}
                        {...form.register(`texts.${locale}.excerpt`)}
                        rows={3}
                        maxLength={B.excerptMax}
                      />
                    )}
                  </Field>
                  <div className="flex flex-col gap-2">
                    <span className="text-label text-foreground">
                      {t("fields.content")}
                      {locale === "id" && (
                        <span aria-hidden className="ml-1 text-destructive">
                          *
                        </span>
                      )}
                    </span>
                    <Controller
                      control={form.control}
                      name={`texts.${locale}.content`}
                      render={({ field }) => (
                        <RichTextEditor
                          key={`${locale}-${editorVersion}`}
                          value={field.value}
                          onChange={field.onChange}
                          label={`${t("fields.content")} (${locale.toUpperCase()})`}
                          placeholder={t("editor.placeholder")}
                          invalid={!!contentError}
                          describedBy={contentError ? `post-content-error-${locale}` : undefined}
                          mediaOptions={mediaOptions}
                          canUseLibrary={canUseLibrary}
                          canUpload={canUploadMedia}
                        />
                      )}
                    />
                    {contentError && (
                      <p
                        id={`post-content-error-${locale}`}
                        role="alert"
                        className="text-body-sm font-medium text-destructive-strong"
                      >
                        {contentError}
                      </p>
                    )}
                  </div>
                </>
              );
            }}
          </LocaleTabs>
        </AdminPanel>

        <div className="flex flex-col gap-6 xl:sticky xl:top-24">
          <AdminPanel
            title={t("sections.publish.title")}
            description={t("sections.publish.description")}
          >
            <Field label={t("fields.status")} error={errorText(errors.status?.message)} required>
              {(control) => (
                <NativeSelect {...control} {...form.register("status")}>
                  {postStatuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                      // Without `publish`, only drafts (and the current status) can be chosen.
                      disabled={
                        !canPublish && status !== "draft" && status !== defaultValues.status
                      }
                    >
                      {publishLabel(status)}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Field
              label={t("fields.publishedAt")}
              description={t("fields.publishedAtHint")}
              error={errorText(errors.publishedAt?.message)}
            >
              {(control) => (
                <Input {...control} {...form.register("publishedAt")} type="datetime-local" />
              )}
            </Field>
            {!canPublish && (
              <p className="rounded-xl bg-surface px-4 py-3 text-body-sm text-muted-foreground">
                {t("publishLocked")}
              </p>
            )}
            {Object.keys(siteHrefs).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(Object.entries(siteHrefs) as [Locale, string][]).map(([locale, href]) => (
                  <Button key={locale} asChild variant="secondary" size="sm">
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon aria-hidden />
                      {t("viewOnSite")} ({locale.toUpperCase()})
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel
            title={t("sections.details.title")}
            description={t("sections.details.description")}
          >
            <Field
              label={t("fields.category")}
              error={errorText(errors.category?.message)}
              required
            >
              {(control) => (
                <NativeSelect {...control} {...form.register("category")}>
                  {postCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Controller
              control={form.control}
              name="coverImageId"
              render={({ field, fieldState }) => (
                <MediaPicker
                  value={field.value}
                  onChange={field.onChange}
                  options={mediaOptions}
                  canUpload={canUploadMedia}
                  label={t("fields.cover")}
                  error={errorText(fieldState.error?.message)}
                />
              )}
            />
            <Field
              label={t("fields.authorName")}
              error={errorText(errors.authorName?.message)}
              required
            >
              {(control) => (
                <Input {...control} {...form.register("authorName")} maxLength={B.authorMax} />
              )}
            </Field>
            <Field
              label={t("fields.authorRole")}
              error={errorText(errors.authorRole?.message)}
              required
            >
              {(control) => (
                <Input
                  {...control}
                  {...form.register("authorRole")}
                  maxLength={B.authorMax}
                  placeholder={t("fields.authorRolePlaceholder")}
                />
              )}
            </Field>
          </AdminPanel>
        </div>
      </div>

      <FormFooter
        sticky
        saveWhenClean={!id}
        saveLabel={id ? undefined : t("createTitle")}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => {
          form.reset();
          setEditorVersion((version) => version + 1);
        }}
      />
    </form>
  );
}

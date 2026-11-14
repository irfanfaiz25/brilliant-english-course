"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import { CharacterCount, FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";
import { routing, type Locale } from "@/i18n/routing";

import { updatePageSeo } from "../actions";
import { formatPageTitle } from "../format";
import { pageSeoSchema, type DerivedSeo, type PageSeo, type PageSeoInput } from "../schema";
import { SearchPreview } from "./search-preview";

/** What the editor shows for one locale besides the form: defaults and the page URL. */
export type PageSeoContext = {
  derived: DerivedSeo;
  /** Site-wide description, used when the page has none. */
  fallbackDescription: string;
  /** Absolute URL of the page, for the preview. */
  url: string;
};

type PageSeoEditorProps = {
  pageName: string;
  defaultValues: PageSeoInput;
  contexts: Record<Locale, PageSeoContext>;
  canEdit: boolean;
  /** Super admins only (ADR-008); others see the checkbox locked. */
  canSetNoindex: boolean;
};

/** "Edit" button that opens a side sheet with the page's title, description and noindex. */
export function PageSeoEditor({
  pageName,
  defaultValues,
  contexts,
  canEdit,
  canSetNoindex,
}: PageSeoEditorProps) {
  const t = useTranslations("AdminSeo");
  const [open, setOpen] = useState(false);
  const noindexHintId = useId();
  const form = useForm<PageSeoInput, unknown, PageSeo>({
    resolver: zodResolver(pageSeoSchema),
    defaultValues,
  });
  const { isDirty } = form.formState;
  const { onSubmit, isPending } = useSaveForm(form, updatePageSeo, {
    onSaved: () => setOpen(false),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Closing without saving drops the draft.
        if (!next) form.reset();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" aria-label={t("pages.editLabel", { page: pageName })}>
          <PencilIcon aria-hidden />
          {t("pages.edit")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:w-[min(92vw,40rem)]">
        <SheetHeader>
          <SheetTitle>{t("editor.title", { page: pageName })}</SheetTitle>
          <SheetDescription>{t("editor.description")}</SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col">
          <fieldset disabled={!canEdit} className="flex flex-col gap-8">
            {routing.locales.map((locale) => (
              <LocaleFields key={locale} form={form} locale={locale} context={contexts[locale]} />
            ))}

            <div className="flex flex-col gap-2">
              <label
                className={
                  canSetNoindex
                    ? "flex cursor-pointer items-start gap-3 text-body-sm font-medium text-foreground"
                    : "flex items-start gap-3 text-body-sm font-medium text-muted-foreground"
                }
              >
                <input
                  type="checkbox"
                  {...form.register("noindex")}
                  disabled={!canSetNoindex}
                  aria-describedby={noindexHintId}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />
                {t("editor.noindex")}
              </label>
              <p id={noindexHintId} className="pl-8 text-body-sm text-muted-foreground">
                {canSetNoindex ? t("editor.noindexHint") : t("editor.noindexLocked")}
              </p>
            </div>

            {canEdit && (
              <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
            )}
          </fieldset>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function LocaleFields({
  form,
  locale,
  context,
}: {
  form: UseFormReturn<PageSeoInput, unknown, PageSeo>;
  locale: Locale;
  context: PageSeoContext;
}) {
  const t = useTranslations("AdminSeo.editor");
  const tLocales = useTranslations("AdminSettings.locales");
  const errorText = useFormErrorText();
  const errors = form.formState.errors.texts?.[locale];
  const { title, description } = useWatch({ control: form.control, name: `texts.${locale}` });
  const { derived } = context;

  return (
    <fieldset className="flex flex-col gap-5 rounded-xl border border-border/70 bg-surface/60 p-4">
      <legend className="px-1 text-label text-foreground">{tLocales(locale)}</legend>
      <Field
        label={t("pageTitle")}
        description={
          <>
            {derived.absoluteTitle ? t("pageTitleHintAbsolute") : t("pageTitleHint")}{" "}
            <CharacterCount count={title.trim().length} max={limits.seo.titleMax} />
          </>
        }
        error={errorText(errors?.title?.message)}
      >
        {(control) => (
          <Input
            {...control}
            {...form.register(`texts.${locale}.title`)}
            lang={locale}
            placeholder={derived.title}
          />
        )}
      </Field>
      <Field
        label={t("pageDescription")}
        description={
          <>
            {t("pageDescriptionHint")}{" "}
            <CharacterCount count={description.trim().length} max={limits.seo.descriptionMax} />
          </>
        }
        error={errorText(errors?.description?.message)}
      >
        {(control) => (
          <Textarea
            {...control}
            {...form.register(`texts.${locale}.description`)}
            lang={locale}
            rows={3}
            placeholder={derived.description ?? context.fallbackDescription}
          />
        )}
      </Field>
      <SearchPreview
        label={t("preview")}
        title={formatPageTitle(title.trim() || derived.title, derived.absoluteTitle)}
        description={description.trim() || derived.description || context.fallbackDescription}
        url={context.url}
      />
    </fieldset>
  );
}

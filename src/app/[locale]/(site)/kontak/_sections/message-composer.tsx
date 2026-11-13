"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  contactMessageLimits,
  contactMessageSchema,
  contactTopics,
  type ContactMessageInput,
} from "@/features/contact/schema";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const defaultValues: ContactMessageInput = {
  // Empty until chosen; the schema rejects it with "choose one".
  topic: "" as ContactMessageInput["topic"],
  name: "",
  message: "",
};

/**
 * Writes a tidy WhatsApp message (who is asking, then the question) and opens it in WhatsApp.
 * Nothing reaches our server, so there is no lead storage or spam surface here. Validation
 * follows the partner form: errors on submit, cleared while typing.
 */
export function MessageComposer({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations("ContactForm");
  const [openedUrl, setOpenedUrl] = useState<string | null>(null);
  const form = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;
  const message = useWatch({ control, name: "message" }) ?? "";
  const errorText = (code?: string) =>
    code ? t(`errors.${code}` as "errors.nameRequired") : undefined;

  const onSubmit = handleSubmit((values) => {
    const text = t("template", {
      name: values.name.trim(),
      topic: t(`topics.${values.topic}`),
      message: values.message.trim(),
    });
    const url = buildWhatsAppUrl(whatsapp, text);
    setOpenedUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  });

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={t("label")}
      className="flex flex-col gap-5 rounded-3xl border border-border/60 bg-card p-5 shadow-glow-primary sm:p-8"
    >
      <fieldset aria-invalid={errors.topic ? true : undefined} className="flex flex-col gap-2">
        <legend className="mb-2 text-label text-foreground">
          {t("topic")}
          <span aria-hidden className="text-destructive">
            *
          </span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {contactTopics.map((topic) => (
            <label
              key={topic}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-xl border border-input bg-background px-2 py-3 text-center text-label text-foreground",
                "transition-[border-color,background-color,box-shadow] duration-(--duration-fast) ease-out hover:border-neutral-400",
                "has-checked:border-primary has-checked:bg-primary-soft/60 has-checked:text-primary has-checked:shadow-sm",
                "has-focus-visible:ring-4 has-focus-visible:ring-primary-soft",
              )}
            >
              <input type="radio" value={topic} {...register("topic")} className="sr-only" />
              {t(`topics.${topic}`)}
            </label>
          ))}
        </div>
        {errors.topic?.message && (
          <p role="alert" className="text-body-sm font-medium text-destructive-strong">
            {errorText(errors.topic.message)}
          </p>
        )}
      </fieldset>

      <Field label={t("name")} required error={errorText(errors.name?.message)}>
        {(controlProps) => (
          <Input
            {...controlProps}
            {...register("name")}
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            maxLength={contactMessageLimits.nameMax}
          />
        )}
      </Field>

      <Field
        label={t("message")}
        required
        description={t("messageCount", {
          count: message.length,
          max: contactMessageLimits.messageMax,
        })}
        error={errorText(errors.message?.message)}
      >
        {(controlProps) => (
          <Textarea
            {...controlProps}
            {...register("message")}
            rows={4}
            maxLength={contactMessageLimits.messageMax}
            placeholder={t("messagePlaceholder")}
          />
        )}
      </Field>

      <p className="flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-caption text-muted-foreground">
        <ShieldCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        {t("privacy")}
      </p>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          variant="whatsapp"
          size="lg"
          pop
          className="w-full sm:w-auto sm:self-start"
        >
          <BrandIcon name="whatsapp" />
          {t("submit")}
        </Button>
        {openedUrl && (
          <p
            role="status"
            className="flex animate-rise-in flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-muted-foreground"
          >
            {t("opened")}
            <a
              href={openedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("openAgain")}
              <ExternalLinkIcon aria-hidden className="size-3.5" />
            </a>
          </p>
        )}
      </div>
    </form>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useWatch, type Control } from "react-hook-form";

import { CardPreview } from "@/components/admin/card-preview";
import type { Locale } from "@/i18n/routing";

import type { Testimonial, TestimonialForm, TestimonialFormInput } from "../schema";
import { TestimonialCard } from "./testimonial-card";

type TestimonialCardPreviewProps = {
  control: Control<TestimonialFormInput, unknown, TestimonialForm>;
  locale: Locale;
  className?: string;
};

/** The public testimonial card with the form's current values, in the active tab's locale. */
export function TestimonialCardPreview({
  control,
  locale,
  className,
}: TestimonialCardPreviewProps) {
  const t = useTranslations("AdminTestimonials");
  const values = useWatch({ control });
  const text = values.texts?.[locale];
  const audience = values.audience ?? "parent";
  const rating = Math.min(5, Math.max(1, Math.round(values.rating || 5)));
  const filled = (value: string | undefined, label: string) => value?.trim() || label;

  const testimonial: Testimonial = {
    id: "preview",
    audience,
    quote: filled(text?.quote, t("fields.quote")),
    author: filled(values.authorName, t("fields.authorName")),
    role: filled(text?.role, t("fields.role")),
    rating,
  };

  return (
    <CardPreview locale={locale} placement={t(`placements.${audience}`)} className={className}>
      <TestimonialCard testimonial={testimonial} ratingLabel={t("rating", { rating })} index={0} />
    </CardPreview>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useWatch, type Control } from "react-hook-form";

import { CardPreview } from "@/components/admin/card-preview";
import type { MediaOption } from "@/features/media/admin-queries";
import type { Locale } from "@/i18n/routing";
import { fillTemplate } from "@/lib/template";

import type { Level, LevelForm, LevelFormInput } from "../schema";
import { LevelCard } from "./level-card";

/** Labels of the public level card in each locale, as plain templates (`{min}–{max} tahun`). */
export type LevelCardLabels = Record<Locale, { ageRange: string; detailLink: string }>;

type LevelCardPreviewProps = {
  control: Control<LevelFormInput, unknown, LevelForm>;
  locale: Locale;
  labels: LevelCardLabels;
  mediaOptions: readonly MediaOption[];
  className?: string;
};

/** The Home level card with the form's current values, in the locale of the active tab. */
export function LevelCardPreview({
  control,
  locale,
  labels,
  mediaOptions,
  className,
}: LevelCardPreviewProps) {
  const t = useTranslations("AdminPrograms");
  const values = useWatch({ control });
  const text = values.texts?.[locale];
  const image = mediaOptions.find((option) => option.id === values.imageId);
  const filled = (value: string | undefined, label: string) => value?.trim() || label;
  const ageMin = Number.isFinite(values.ageMin) ? Number(values.ageMin) : 0;
  const ageMax = Number.isFinite(values.ageMax) ? Number(values.ageMax) : 0;

  const level: Level | null =
    image && values.slug
      ? {
          slug: values.slug,
          name: filled(text?.name, t("fields.name")),
          ageMin,
          ageMax,
          tagline: filled(text?.tagline, t("fields.tagline")),
          summary: filled(text?.summary, t("fields.summary")),
          skills: (text?.skills ?? []).flatMap((row) => (row?.value?.trim() ? [row.value] : [])),
          description: text?.description ?? "",
          curriculum: [],
          sessionsPerWeek: Number(values.sessionsPerWeek) || 0,
          maxStudentsPerClass: Number(values.maxStudentsPerClass) || 0,
          image: { src: image.src, width: image.width, height: image.height, alt: "" },
        }
      : null;

  return (
    <CardPreview locale={locale} placement={t("previewPlacement")} className={className}>
      {level && (
        <LevelCard
          level={level}
          ageLabel={fillTemplate(labels[locale].ageRange, { min: ageMin, max: ageMax })}
          detailLabel={labels[locale].detailLink}
        />
      )}
    </CardPreview>
  );
}

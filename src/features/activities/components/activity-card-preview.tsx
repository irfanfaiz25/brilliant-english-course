"use client";

import { useTranslations } from "next-intl";
import { useWatch, type Control } from "react-hook-form";

import { CardPreview } from "@/components/admin/card-preview";
import type { MediaOption } from "@/features/media/admin-queries";
import type { Locale } from "@/i18n/routing";

import type { Activity, ActivityForm, ActivityFormInput } from "../schema";
import { ActivityCard } from "./activity-card";

/** The public card's link label in each locale. */
export type ActivityCardLabels = Record<Locale, { detailLink: string }>;

type ActivityCardPreviewProps = {
  control: Control<ActivityFormInput, unknown, ActivityForm>;
  locale: Locale;
  labels: ActivityCardLabels;
  mediaOptions: readonly MediaOption[];
  className?: string;
};

/** The activity card with the form's current values, in the locale of the active tab. */
export function ActivityCardPreview({
  control,
  locale,
  labels,
  mediaOptions,
  className,
}: ActivityCardPreviewProps) {
  const t = useTranslations("AdminActivities");
  const values = useWatch({ control });
  const text = values.texts?.[locale];
  const image = mediaOptions.find((option) => option.id === values.imageId);
  const filled = (value: string | undefined, label: string) => value?.trim() || label;

  const activity: Activity | null = image
    ? {
        slug: "preview",
        name: filled(text?.name, t("fields.name")),
        summary: filled(text?.summary, t("fields.summary")),
        audience: filled(text?.audience, t("fields.audience")),
        image: { src: image.src, width: image.width, height: image.height, alt: "" },
      }
    : null;

  return (
    <CardPreview locale={locale} placement={t("previewPlacement")} className={className}>
      {activity && (
        <div className="mx-auto max-w-72">
          <ActivityCard activity={activity} detailLabel={labels[locale].detailLink} />
        </div>
      )}
    </CardPreview>
  );
}

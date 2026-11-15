"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useId, useState } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from "react-hook-form";

import { MediaPicker } from "@/components/admin/media-picker";
import type { MediaOption } from "@/features/media/admin-queries";
import { cn } from "@/lib/utils";

import { partnershipIcons, type PartnershipIcon as IconName } from "../page-schema";
import { PartnershipIcon } from "./partnership-icon";

type IconPickerProps<TValues extends FieldValues, TOutput> = {
  control: Control<TValues, unknown, TOutput>;
  /** The fixed icon field (`…icon`). */
  iconName: FieldPath<TValues>;
  /** The custom icon field (`…iconImageId`, "" for none). */
  imageName: FieldPath<TValues>;
  mediaOptions: readonly MediaOption[];
  canUpload: boolean;
  disabled?: boolean;
};

/**
 * Picks an item's icon (ADR-041): a visual grid of the fixed icons (a radio group, so arrow keys
 * move between them), or a custom image from the media library that replaces the icon on the
 * site. Switching back to the fixed icons clears the custom image.
 */
export function IconPicker<TValues extends FieldValues, TOutput>({
  control,
  iconName,
  imageName,
  mediaOptions,
  canUpload,
  disabled = false,
}: IconPickerProps<TValues, TOutput>) {
  const t = useTranslations("AdminPartnershipPage");
  const id = useId();
  const icon = useController({ control, name: iconName });
  const image = useController({ control, name: imageName });
  const hasImage = Boolean(image.field.value);
  const [mode, setMode] = useState<"icon" | "image">(hasImage ? "image" : "icon");

  const choose = (next: "icon" | "image") => {
    setMode(next);
    // Back to the fixed icons: the custom image no longer applies.
    if (next === "icon" && hasImage)
      image.field.onChange("" as PathValue<TValues, typeof imageName>);
  };

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-1 text-label text-foreground">{t("fields.icon")}</legend>
      <div
        role="radiogroup"
        aria-label={t("iconPicker.mode")}
        className="inline-flex w-fit rounded-xl bg-muted p-1"
      >
        {(["icon", "image"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => choose(option)}
            className={cn(
              "min-h-9 rounded-lg px-3.5 text-body-sm font-semibold transition-colors duration-(--duration-fast)",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              mode === option
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`iconPicker.${option}`)}
          </button>
        ))}
      </div>

      {mode === "icon" ? (
        <div
          role="radiogroup"
          aria-label={t("iconPicker.icons")}
          className="flex flex-wrap gap-1.5"
        >
          {partnershipIcons.map((name: IconName) => {
            const checked = icon.field.value === name;
            const label = t(`icons.${name}`);
            return (
              <label
                key={name}
                title={label}
                className={cn(
                  "relative flex size-11 cursor-pointer items-center justify-center rounded-xl border transition-colors duration-(--duration-fast)",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  checked
                    ? "border-partner bg-partner-soft text-partner"
                    : "border-border/70 bg-background text-muted-foreground hover:border-partner/50 hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-icon`}
                  value={name}
                  checked={checked}
                  onChange={() => icon.field.onChange(name as PathValue<TValues, typeof iconName>)}
                  className="sr-only"
                />
                <PartnershipIcon name={name} className="size-5" />
                <span className="sr-only">{label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <MediaPicker
            value={String(image.field.value ?? "")}
            onChange={(next) => image.field.onChange(next as PathValue<TValues, typeof imageName>)}
            options={mediaOptions}
            canUpload={canUpload}
            label={t("iconPicker.image")}
            disabled={disabled}
            optional
            preview="icon"
          />
          <p className="text-body-sm text-muted-foreground">{t("iconPicker.imageHint")}</p>
        </div>
      )}
    </fieldset>
  );
}

/** The small icon in an item's row header: the custom image's thumbnail, or the fixed icon. */
export function ItemIconBadge({
  icon,
  iconImageId,
  mediaOptions,
}: {
  icon: IconName | undefined;
  iconImageId: string | undefined;
  mediaOptions: readonly MediaOption[];
}) {
  const image = iconImageId ? mediaOptions.find((option) => option.id === iconImageId) : undefined;
  if (image) {
    return (
      <Image
        src={image.src}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0 object-contain"
      />
    );
  }
  return icon ? <PartnershipIcon name={icon} className="size-4 shrink-0 text-partner" /> : null;
}

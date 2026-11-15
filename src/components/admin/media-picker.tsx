"use client";

import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { MediaOption } from "@/features/media/admin-queries";
import { cn } from "@/lib/utils";

import { MediaLibraryDialog } from "./media-library-dialog";

type MediaPickerProps = {
  /** `media_assets` id, or "" when nothing is picked. */
  value: string;
  onChange: (id: string) => void;
  options: readonly MediaOption[];
  label: string;
  /** Validation message under the preview. */
  error?: string;
  disabled?: boolean;
  /** Offers uploading a new image inside the dialog (`media` create permission). */
  canUpload?: boolean;
  /** The image is optional: offers removing it (the field then holds ""). */
  optional?: boolean;
  /** `icon`: a small square preview showing the whole image (custom icons), not a photo crop. */
  preview?: "photo" | "icon";
};

/** Image field: a preview of the picked image and the media library dialog to pick another. */
export function MediaPicker({
  value,
  onChange,
  options,
  label,
  error,
  disabled,
  canUpload = false,
  optional = false,
  preview = "photo",
}: MediaPickerProps) {
  const t = useTranslations("AdminForms.media");
  const [open, setOpen] = useState(false);
  // An image picked right after uploading is shown before the refresh brings it into `options`.
  const [picked, setPicked] = useState<MediaOption | null>(null);
  const selected =
    options.find((option) => option.id === value) ?? (picked?.id === value ? picked : undefined);

  return (
    // A container, not the viewport, decides the layout: the picker also sits in narrow side columns.
    <div className="@container flex flex-col gap-2">
      <span className="text-label text-foreground">{label}</span>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border bg-background/60 p-3 @sm:flex-row @sm:items-center",
          error ? "border-destructive" : "border-border/70",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg bg-muted",
            preview === "icon" ? "size-20 bg-dots p-3" : "aspect-[3/2] w-full @sm:w-48",
          )}
        >
          {selected ? (
            <Image
              src={selected.src}
              alt=""
              fill
              sizes={preview === "icon" ? "5rem" : "(min-width: 640px) 352px, 100vw"}
              className={preview === "icon" ? "object-contain p-3" : "object-cover"}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon aria-hidden className="size-8" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p
            className="w-full max-w-full truncate text-body-sm text-muted-foreground"
            aria-live="polite"
          >
            {selected ? selected.name : t("none")}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            {selected ? t("change") : t("pick")}
          </Button>
          {optional && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              {t("remove")}
            </Button>
          )}
          <MediaLibraryDialog
            open={open}
            onOpenChange={setOpen}
            options={options}
            value={value}
            canUpload={canUpload}
            onPick={(media) => {
              setPicked(media);
              onChange(media.id);
            }}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-body-sm font-medium text-destructive-strong">
          {error}
        </p>
      )}
    </div>
  );
}

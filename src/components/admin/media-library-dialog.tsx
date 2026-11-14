"use client";

import { ArrowLeftIcon, CheckIcon, ImageUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RadioGroup } from "radix-ui";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaOption } from "@/features/media/admin-queries";
import type { UploadedMedia } from "@/features/media/admin-service";
import { MediaUploader } from "@/features/media/components/media-uploader";
import { cn } from "@/lib/utils";

type MediaLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: readonly MediaOption[];
  /** The image picked so far ("" when none). */
  value?: string;
  /** Offers uploading inside the dialog (`media` create permission). */
  canUpload?: boolean;
  onPick: (media: MediaOption) => void;
};

/**
 * The media library as a dialog: a radio grid of images (arrow keys move, Enter picks) and, with
 * `canUpload`, the uploader. A finished upload joins the grid and is picked; the page refreshes so
 * previews know it too. Used by `MediaPicker` and the blog editor's image button.
 */
export function MediaLibraryDialog({ open, onOpenChange, ...props }: MediaLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {/* Mounted per opening, so every opening starts from the current value. */}
        <LibraryBody {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function LibraryBody({
  options,
  value = "",
  canUpload = false,
  onPick,
  onClose,
}: Omit<MediaLibraryDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const t = useTranslations("AdminForms.media");
  const router = useRouter();
  const [draft, setDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  // Uploaded here and not yet in `options` (until the refresh brings them).
  const [uploaded, setUploaded] = useState<readonly MediaOption[]>([]);
  const all = [
    ...uploaded.filter((item) => !options.some((option) => option.id === item.id)),
    ...options,
  ];

  const onUploaded = useCallback(
    (media: UploadedMedia) => {
      setUploaded((current) => [media, ...current]);
      setDraft(media.id);
      router.refresh();
    },
    [router],
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>
      {canUpload && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setUploading((current) => !current)}
        >
          {uploading ? <ArrowLeftIcon aria-hidden /> : <ImageUpIcon aria-hidden />}
          {uploading ? t("backToLibrary") : t("upload")}
        </Button>
      )}
      {uploading ? (
        <div className="max-h-[60vh] overflow-y-auto">
          <MediaUploader onUploaded={onUploaded} />
        </div>
      ) : all.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-body-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <RadioGroup.Root
          value={draft}
          onValueChange={setDraft}
          aria-label={t("title")}
          className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3"
        >
          {all.map((option) => (
            <RadioGroup.Item
              key={option.id}
              value={option.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border-2 border-transparent bg-muted text-left",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "data-[state=checked]:border-primary",
              )}
            >
              <span className="relative aspect-[3/2] w-full">
                <Image
                  src={option.src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 240px, 50vw"
                  className="object-cover"
                />
              </span>
              <span className="truncate px-2 py-1.5 text-caption text-foreground">
                {option.name}
              </span>
              <RadioGroup.Indicator className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon aria-hidden className="size-4" />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          {t("cancelPick")}
        </Button>
        <Button
          type="button"
          disabled={!draft}
          onClick={() => {
            const picked = all.find((option) => option.id === draft);
            if (picked) onPick(picked);
            onClose();
          }}
        >
          {t("use")}
        </Button>
      </DialogFooter>
    </>
  );
}

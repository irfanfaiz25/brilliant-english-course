"use client";

import { ArrowLeftIcon, CheckIcon, ImageIcon, ImageUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { RadioGroup } from "radix-ui";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MediaOption } from "@/features/media/admin-queries";
import type { UploadedMedia } from "@/features/media/admin-service";
import { MediaUploader } from "@/features/media/components/media-uploader";
import { cn } from "@/lib/utils";

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
};

/**
 * Image field: a preview of the picked image and a dialog with the media library as a radio grid
 * (arrow keys move, Enter picks). With `canUpload` the dialog can switch to the uploader; a
 * finished upload joins the grid, is picked, and the page refreshes so previews know it too.
 */
export function MediaPicker({
  value,
  onChange,
  options,
  label,
  error,
  disabled,
  canUpload = false,
}: MediaPickerProps) {
  const t = useTranslations("AdminForms.media");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  // Uploaded in this dialog and not yet in `options` (until the refresh brings them).
  const [uploaded, setUploaded] = useState<readonly MediaOption[]>([]);
  const all = [...uploaded.filter((item) => !options.some((o) => o.id === item.id)), ...options];
  const selected = all.find((option) => option.id === value);

  const onUploaded = useCallback(
    (media: UploadedMedia) => {
      setUploaded((current) => [media, ...current]);
      setDraft(media.id);
      router.refresh();
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-foreground">{label}</span>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border bg-background/60 p-3 sm:flex-row sm:items-center",
          error ? "border-destructive" : "border-border/70",
        )}
      >
        <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48">
          {selected ? (
            <Image
              src={selected.src}
              alt=""
              fill
              sizes="(min-width: 640px) 192px, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon aria-hidden className="size-8" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <p className="truncate text-body-sm text-muted-foreground" aria-live="polite">
            {selected ? selected.name : t("none")}
          </p>
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (next) {
                setDraft(value);
                setUploading(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" size="sm" disabled={disabled}>
                {selected ? t("change") : t("pick")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
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
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {t("cancelPick")}
                </Button>
                <Button
                  type="button"
                  disabled={!draft}
                  onClick={() => {
                    onChange(draft);
                    setOpen(false);
                  }}
                >
                  {t("use")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

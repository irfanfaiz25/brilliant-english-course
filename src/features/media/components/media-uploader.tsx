"use client";

import {
  CircleAlertIcon,
  CircleCheckIcon,
  ImageOffIcon,
  ImageUpIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { cn } from "@/lib/utils";

import type { UploadedMedia } from "../admin-service";
import { formatBytes } from "../format";
import { mediaUploadTypes } from "../schema";
import { useMediaUpload, type UploadItem } from "./use-media-upload";

const MB = 1024 * 1024;

/** Files the browser cannot show as a thumbnail. */
const unreadable = new Set<string>(["fileType", "fileEmpty", "invalidImage"]);

/** Problems a second try can fix; a wrong type or size needs another file. */
const retryable = new Set<string>(["uploadFailed", "uploadMissing", "unknown"]);

/**
 * Drop zone + upload queue (DESIGN.md § 6, media). Files can be dropped or chosen; each shows its
 * thumbnail, real byte progress, then "processing" while the server makes the WebP. Used on the
 * library page and inside the media picker.
 */
export function MediaUploader({
  onUploaded,
  linkToDetail = false,
  className,
}: {
  onUploaded?: (media: UploadedMedia) => void;
  /** Finished files link to their library page. */
  linkToDetail?: boolean;
  className?: string;
}) {
  const t = useTranslations("AdminMedia.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const { items, add, cancel, retry, remove, clear } = useMediaUpload({ onUploaded });
  const limitsText = {
    maxMb: limits.media.maxUploadBytes / MB,
    maxFiles: limits.media.maxFilesPerBatch,
    maxPx: limits.media.maxDimension,
  };

  const queue = (files: readonly File[]) => {
    if (files.length === 0) return;
    const skipped = add(files);
    if (skipped > 0) toast.warning(t("tooMany", { max: limits.media.maxFilesPerBatch }));
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    queue([...event.dataTransfer.files]);
  };

  const done = items.filter((item) => item.status === "done").length;
  const settled = items.every(
    (item) =>
      item.status !== "queued" && item.status !== "uploading" && item.status !== "processing",
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors duration-(--duration-fast) sm:py-8",
          dragging ? "border-primary bg-primary-soft" : "border-border bg-background/50",
        )}
      >
        <span
          aria-hidden
          className="hidden size-12 items-center justify-center rounded-full bg-primary-soft text-primary sm:flex"
        >
          <ImageUpIcon className="size-6" />
        </span>
        {/* Phones have no dragging: they get the button and the rules only. */}
        <p className="hidden text-label text-foreground sm:block">
          {dragging ? t("dropActive") : t("drop")}
          <span className="sr-only">
            {" "}
            {t("or")} {t("choose")}
          </span>
        </p>
        <span aria-hidden className="hidden text-caption text-muted-foreground sm:inline">
          {t("or")}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUpIcon aria-hidden className="sm:hidden" />
          {t("choose")}
        </Button>
        <p id={hintId} className="max-w-md text-caption text-muted-foreground">
          {t("description", limitsText)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={mediaUploadTypes.join(",")}
          multiple
          hidden
          onChange={(event) => {
            queue([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label text-foreground" aria-live="polite">
              {t("queueTitle", { done, total: items.length })}
            </p>
            {settled && (
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                {t("clear")}
              </Button>
            )}
          </div>
          <ul className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/70 bg-background/60">
            {items.map((item) => (
              <UploadRow
                key={item.id}
                item={item}
                linkToDetail={linkToDetail}
                onCancel={() => cancel(item.id)}
                onRetry={() => retry(item.id)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UploadRow({
  item,
  linkToDetail,
  onCancel,
  onRetry,
  onRemove,
}: {
  item: UploadItem;
  linkToDetail: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("AdminMedia.upload");
  const locale = useLocale();
  const name = item.file.name;
  const percent =
    item.status === "processing" || item.status === "done"
      ? 100
      : Math.round((item.loaded / Math.max(item.file.size, 1)) * 100);
  const working = item.status === "uploading" || item.status === "processing";

  const status = (() => {
    switch (item.status) {
      case "queued":
        return t("queued");
      case "uploading":
        return t("uploading", {
          loaded: formatBytes(item.loaded, locale),
          total: formatBytes(item.file.size, locale),
        });
      case "processing":
        return t("processing");
      case "done":
        return t("done", { width: item.result?.width ?? 0, height: item.result?.height ?? 0 });
      case "cancelled":
        return t("cancelled");
      case "error":
        return t(`errors.${item.error ?? "unknown"}`, {
          maxMb: limits.media.maxUploadBytes / MB,
        });
    }
  })();

  const title =
    item.status === "done" && linkToDetail && item.result ? (
      <Link
        href={`${adminRoutes.media}/${item.result.id}`}
        className="truncate text-body-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        {item.result.name}
      </Link>
    ) : (
      <span className="truncate text-body-sm font-semibold text-foreground">
        {item.result?.name ?? name}
      </span>
    );

  return (
    <li className="flex items-center gap-3 p-3">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {unreadable.has(item.error ?? "") ? (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOffIcon aria-hidden className="size-5" />
          </span>
        ) : (
          <Image src={item.preview} alt="" fill unoptimized sizes="48px" className="object-cover" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          {title}
          {working && (
            <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
              {percent}%
            </span>
          )}
        </div>
        <div
          role="progressbar"
          aria-label={name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-(--duration-fast)",
              item.status === "error" && "bg-destructive",
              item.status === "done" && "bg-success",
              item.status === "processing" && "animate-pulse bg-primary",
              (item.status === "uploading" || item.status === "queued") && "bg-primary",
              item.status === "cancelled" && "bg-muted-foreground/40",
            )}
            style={{
              width: `${item.status === "error" || item.status === "cancelled" ? 100 : percent}%`,
            }}
          />
        </div>
        <p
          className={cn(
            "flex items-start gap-1.5 text-caption [&>svg]:mt-0.5 [&>svg]:shrink-0",
            item.status === "error" ? "text-destructive-strong" : "text-muted-foreground",
          )}
        >
          {item.status === "processing" && (
            <LoaderCircleIcon aria-hidden className="size-3.5 animate-spin" />
          )}
          {item.status === "done" && (
            <CircleCheckIcon aria-hidden className="size-3.5 text-success-strong" />
          )}
          {item.status === "error" && <CircleAlertIcon aria-hidden className="size-3.5" />}
          <span className="min-w-0">{status}</span>
        </p>
      </div>
      {((item.status === "error" && retryable.has(item.error ?? "unknown")) ||
        item.status === "cancelled") && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("retry", { name })}
          onClick={onRetry}
        >
          <RotateCcwIcon aria-hidden />
        </Button>
      )}
      {working || item.status === "queued" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("cancel", { name })}
          onClick={onCancel}
          disabled={item.status === "processing"}
        >
          <XIcon aria-hidden />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("remove", { name })}
          onClick={onRemove}
        >
          <XIcon aria-hidden />
        </Button>
      )}
    </li>
  );
}

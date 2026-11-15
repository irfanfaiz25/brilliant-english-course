"use client";

import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon } from "lucide-react";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ImageRef } from "@/lib/schemas";
import { fillTemplate } from "@/lib/template";
import { cn } from "@/lib/utils";

export type GalleryPhoto = { image: ImageRef; caption: string };

type PhotoGalleryProps = {
  photos: GalleryPhoto[];
  labels: {
    /** Accessible name of the gallery, e.g. "Momen pelatihan". */
    gallery: string;
    /** "Buka foto {index}" — the button that opens a photo in the viewer. */
    open: string;
    /** "+{count} foto" on the last collage tile when more photos follow. */
    more: string;
    /** "Foto {current} dari {total}". */
    position: string;
    previous: string;
    next: string;
  };
  className?: string;
};

/** Tiles shown in the desktop collage: one large photo and two beside it. */
const collageSize = 3;

/**
 * Photos of real moments (DESIGN.md § 5 Kemitraan): from `sm` a collage (one large photo and two
 * beside it, the last one saying "+N" when more follow), on phones a swipeable row. Any photo
 * opens a viewer with the whole picture (never cropped), its caption, previous/next buttons and
 * arrow keys. Captions double as alt text; photos without one fall back to the gallery's name.
 */
export function PhotoGallery({ photos, labels, className }: PhotoGalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return null;

  const altOf = (photo: GalleryPhoto) => photo.caption || labels.gallery;
  const hidden = photos.length - collageSize;
  const show = (index: number) => setOpen((index + photos.length) % photos.length);
  const current = open === null ? null : photos[open];

  const tile = (photo: GalleryPhoto, index: number, sizes: string, extra?: number) => (
    <button
      type="button"
      onClick={() => setOpen(index)}
      aria-label={fillTemplate(labels.open, { index: index + 1 })}
      className="group relative block size-full overflow-hidden rounded-2xl bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Image
        src={photo.image.src}
        alt={altOf(photo)}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
      />
      {extra ? (
        <span className="absolute inset-0 flex items-center justify-center bg-inverse/70 text-h4 text-inverse-foreground">
          {fillTemplate(labels.more, { count: extra })}
        </span>
      ) : (
        <>
          {photo.caption && (
            <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-background/90 px-3 py-1 text-caption font-semibold text-foreground shadow-sm backdrop-blur">
              {photo.caption}
            </span>
          )}
          <span className="absolute top-2.5 right-2.5 inline-flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100">
            <ExpandIcon aria-hidden className="size-4" />
          </span>
        </>
      )}
    </button>
  );

  const collage = photos.slice(0, collageSize);

  return (
    <div className={className}>
      {/* Phones: a swipeable row of every photo. */}
      <ul
        aria-label={labels.gallery}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-2 sm:hidden"
      >
        {photos.map((photo, index) => (
          <li key={photo.image.src} className="aspect-[4/3] w-[85%] shrink-0 snap-start">
            {tile(photo, index, "85vw")}
          </li>
        ))}
      </ul>

      {/* From `sm`: one large photo beside up to two smaller ones. */}
      <ul
        aria-label={labels.gallery}
        className={cn(
          "hidden gap-3 sm:grid",
          collage.length === 1 && "grid-cols-1",
          collage.length === 2 && "grid-cols-2",
          collage.length === 3 && "grid-cols-[1.6fr_1fr] grid-rows-2",
        )}
      >
        {collage.map((photo, index) => (
          <li
            key={photo.image.src}
            className={cn(
              "aspect-[4/3]",
              collage.length === 3 && index === 0 && "row-span-2 aspect-auto",
            )}
          >
            {tile(
              photo,
              index,
              index === 0 ? "(min-width: 1024px) 28vw, 55vw" : "(min-width: 1024px) 16vw, 30vw",
              index === collageSize - 1 && hidden > 0 ? hidden : undefined,
            )}
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        {current && open !== null && (
          <DialogContent
            className="max-w-4xl gap-4 p-4 sm:p-5"
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === "ArrowRight") show(open + 1);
              if (event.key === "ArrowLeft") show(open - 1);
            }}
          >
            <DialogTitle className="sr-only">{altOf(current)}</DialogTitle>
            <DialogDescription className="sr-only">
              {fillTemplate(labels.position, { current: open + 1, total: photos.length })}
            </DialogDescription>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <Image
                src={current.image.src}
                alt={altOf(current)}
                fill
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => show(open - 1)}
                disabled={photos.length < 2}
                aria-label={labels.previous}
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-(--duration-fast) hover:border-primary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
              >
                <ChevronLeftIcon aria-hidden className="size-5" />
              </button>
              <p className="flex min-w-0 flex-col items-center text-center">
                {current.caption && (
                  <span className="text-label text-foreground">{current.caption}</span>
                )}
                <span className="text-caption text-muted-foreground" aria-live="polite">
                  {fillTemplate(labels.position, { current: open + 1, total: photos.length })}
                </span>
              </p>
              <button
                type="button"
                onClick={() => show(open + 1)}
                disabled={photos.length < 2}
                aria-label={labels.next}
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-(--duration-fast) hover:border-primary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
              >
                <ChevronRightIcon aria-hidden className="size-5" />
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

"use client";

import { CalendarClockIcon, CheckIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { fillTemplate } from "@/lib/template";
import { cn } from "@/lib/utils";

import type { Activity } from "../schema";

export type ActivityDetailLabels = {
  /** "Foto {index}" — a thumbnail that shows that photo. */
  photo: string;
  highlights: string;
  skills: string;
  findUnit: string;
  askWhatsApp: string;
};

type ActivityDetailProps = {
  activity: Activity;
  labels: ActivityDetailLabels;
  /** Pre-filled WhatsApp link about this activity. */
  whatsappUrl: string;
  /** Hide "find the nearest unit" where the visitor is already on a unit's page. */
  showFindUnit: boolean;
};

/**
 * The body of an activity's popup (ADR-042): the card photo and its gallery (thumbnails switch
 * the large photo, shown whole), then what the activity is, when it runs, what children do,
 * the skills it practises and the two parent actions. Empty details are left out.
 */
export function ActivityDetail({
  activity,
  labels,
  whatsappUrl,
  showFindUnit,
}: ActivityDetailProps) {
  const photos = [{ image: activity.image, caption: "" }, ...activity.photos];
  const [current, setCurrent] = useState(0);
  const shown = photos[current] ?? photos[0];

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2 bg-muted/60 p-3 lg:p-4">
        {shown && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-video lg:aspect-[4/3]">
            <Image
              key={shown.image.src}
              src={shown.image.src}
              alt={shown.image.alt}
              fill
              sizes="(min-width: 1024px) 30rem, (min-width: 640px) 56rem, 100vw"
              className="animate-rise-in object-contain motion-reduce:animate-none"
            />
            {shown.caption && (
              <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-background/90 px-3 py-1 text-caption font-semibold text-foreground shadow-sm">
                {shown.caption}
              </span>
            )}
          </div>
        )}
        {photos.length > 1 && (
          <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <li key={photo.image.src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={fillTemplate(labels.photo, { index: index + 1 })}
                  aria-pressed={index === current}
                  className={cn(
                    "relative block size-16 overflow-hidden rounded-lg ring-2 transition-[box-shadow,opacity] duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    index === current
                      ? "ring-primary"
                      : "opacity-70 ring-transparent hover:opacity-100",
                  )}
                >
                  <Image src={photo.image.src} alt="" fill sizes="4rem" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 pr-8">
          <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-caption font-semibold text-primary">
            {activity.audience}
          </span>
          <DialogTitle className="text-h3">{activity.name}</DialogTitle>
          {activity.schedule && (
            <p className="flex items-center gap-1.5 text-body-sm font-semibold text-partner">
              <CalendarClockIcon aria-hidden className="size-4" />
              {activity.schedule}
            </p>
          )}
          <DialogDescription>{activity.description || activity.summary}</DialogDescription>
        </div>

        {activity.highlights.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-overline text-muted-foreground uppercase">{labels.highlights}</h3>
            <ul className="flex flex-col gap-2">
              {activity.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2.5 text-body-sm text-foreground"
                >
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-strong">
                    <CheckIcon aria-hidden className="size-3" />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </section>
        )}

        {activity.skills.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-overline text-muted-foreground uppercase">{labels.skills}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {activity.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-highlight-soft px-3 py-1 text-caption font-semibold text-foreground"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap">
          {showFindUnit && (
            <Button asChild size="sm">
              <Link href="/cek-unit">
                <MapPinIcon aria-hidden />
                {labels.findUnit}
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="secondary">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <BrandIcon name="whatsapp" className="text-whatsapp" />
              {labels.askWhatsApp}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

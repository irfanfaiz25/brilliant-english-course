import { ArrowUpRightIcon } from "lucide-react";
import Image from "next/image";

import { Link } from "@/i18n/navigation";

import type { Activity } from "../schema";

/** Photo-led activity card with the text on a dark gradient for depth and legibility. */
export function ActivityCard({
  activity,
  detailLabel,
}: {
  activity: Activity;
  /** Label of the link to the Program page; without it the card is not a link. */
  detailLabel?: string;
}) {
  return (
    <article className="group relative isolate flex aspect-[3/4] h-full flex-col justify-end overflow-hidden rounded-xl shadow-card transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg has-[a:focus-visible]:-translate-y-1">
      <Image
        src={activity.image.src}
        alt={activity.image.alt}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 80vw"
        className="-z-20 object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-teal-900/95 via-teal-900/45 to-transparent"
      />

      <span className="absolute top-4 left-4 rounded-full bg-white/20 px-3 py-1 text-caption font-semibold text-inverse-foreground backdrop-blur">
        {activity.audience}
      </span>

      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-h4 text-inverse-foreground">{activity.name}</h3>
        <p className="text-body-sm text-inverse-muted">{activity.summary}</p>
        {detailLabel && (
          <Link
            href={{ pathname: "/program", hash: "kegiatan" }}
            className="mt-1 inline-flex items-center gap-1 text-label text-sunny-300 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {detailLabel}
            <ArrowUpRightIcon
              aria-hidden
              className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        )}
      </div>
    </article>
  );
}

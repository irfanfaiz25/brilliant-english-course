import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { levelTheme } from "../level-theme";
import type { Level } from "../schema";

type LevelCardProps = {
  level: Level;
  ageLabel: string;
  detailLabel: string;
};

/**
 * Program level card. The whole card is one link (stretched) to the level on the Program page.
 * Its id (`level-<slug>`) is the target of the hero age chips, which highlight it via `:target`.
 */
export function LevelCard({ level, ageLabel, detailLabel }: LevelCardProps) {
  const theme = levelTheme[level.slug];

  return (
    <article
      id={`level-${level.slug}`}
      className={cn(
        "group relative flex h-full scroll-mt-28 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-card",
        "transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg has-[a:focus-visible]:-translate-y-1 has-[a:focus-visible]:shadow-lg",
        "target:shadow-lg target:ring-4 hover:ring-8 has-[a:focus-visible]:ring-8",
        theme.halo,
        theme.ring,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={level.image.src}
          alt={level.image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
        />
        <span aria-hidden className={cn("absolute inset-x-0 bottom-0 h-1.5", theme.bar)} />
        <span className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1 text-caption font-semibold text-foreground shadow-sm backdrop-blur">
          {ageLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <Badge variant={theme.badge} className="text-label">
            {level.name}
          </Badge>
          <h3 className="text-h4 text-foreground">{level.tagline}</h3>
          <p className="text-body text-muted-foreground">{level.summary}</p>
        </div>

        <ul className="flex flex-col gap-2">
          {level.skills.map((skill) => (
            <li key={skill} className="flex items-center gap-2.5 text-body-sm text-foreground">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full",
                  theme.soft,
                  theme.accent,
                )}
              >
                <CheckIcon aria-hidden className="size-3.5" />
              </span>
              {skill}
            </li>
          ))}
        </ul>

        <Link
          href={{ pathname: "/program", hash: level.slug }}
          className="mt-auto inline-flex items-center gap-1.5 pt-2 text-label text-primary after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {detailLabel}
          <ArrowRightIcon
            aria-hidden
            className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}

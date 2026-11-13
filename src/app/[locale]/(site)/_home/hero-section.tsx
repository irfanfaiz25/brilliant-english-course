import { ArrowRightIcon, LayersIcon, MapPinIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { DecorBlob } from "@/components/site/decor-blob";
import { Button } from "@/components/ui/button";
import { placeholderImages } from "@/config/placeholder-images";
import { levelTheme } from "@/features/programs/level-theme";
import type { Level } from "@/features/programs/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Home hero (DESIGN.md § 5.2): dual path (parents → find a unit, partners → partnership),
 * age chips that jump to and highlight the matching level card (CSS `:target`, no JS).
 * The headline and photo render immediately — they are the LCP, so they are never animated in.
 */
export async function HeroSection({ levels }: { levels: Level[] }) {
  const t = await getTranslations("Home.hero");

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-gradient-soft"
    >
      <DecorBlob tone="highlight" className="top-16 -right-24 size-80" />
      <DecorBlob tone="primary" className="-bottom-24 -left-32 size-96" />
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-dots [mask-image:radial-gradient(70%_70%_at_70%_40%,black,transparent)] opacity-70 lg:block"
      />

      <div className="mx-auto grid w-full max-w-page items-center gap-12 px-5 pt-8 pb-24 md:px-8 md:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-14 lg:pb-32">
        <div className="flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-overline tracking-wide text-partner uppercase shadow-sm backdrop-blur sm:tracking-widest">
            <span aria-hidden className="size-1.5 rounded-full bg-partner" />
            {t("overline")}
          </p>

          <h1 id="hero-title" className="text-display text-primary">
            {t.rich("title", {
              hl: (chunks) => (
                <span className="relative inline-block text-partner">
                  {chunks}
                  <svg
                    aria-hidden
                    viewBox="0 0 120 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1 left-0 h-3 w-full text-highlight"
                  >
                    <path
                      d="M2 9c30-6 80-8 116-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              ),
            })}
          </h1>

          <p className="max-w-xl text-body-lg text-muted-foreground">{t("lead")}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" pop>
              <Link href="/cek-unit">
                <MapPinIcon aria-hidden />
                {t("primaryCta")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/program">{t("secondaryCta")}</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 items-center gap-2 sm:flex sm:flex-wrap">
            <span className="col-span-3 text-label text-muted-foreground sm:col-span-1">
              {t("agePrompt")}
            </span>
            {levels.map((level) => (
              <a
                key={level.slug}
                href={`#level-${level.slug}`}
                aria-label={t("ageOptionLabel", {
                  min: level.ageMin,
                  max: level.ageMax,
                  level: level.name,
                })}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-label text-foreground shadow-sm",
                  "transition-[transform,border-color,background-color,box-shadow] duration-(--duration-fast) ease-out hover:-translate-y-0.5 hover:shadow-md",
                  levelTheme[level.slug].chip,
                )}
              >
                {t("ageOption", { min: level.ageMin, max: level.ageMax })}
              </a>
            ))}
          </div>

          <p className="text-body-sm text-muted-foreground">
            {t("partnerPrompt")}{" "}
            <Link
              href="/kemitraan"
              className="group inline-flex items-center gap-1 font-semibold text-partner underline-offset-4 hover:underline"
            >
              {t("partnerLink")}
              <ArrowRightIcon
                aria-hidden
                className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
              />
            </Link>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <span
            aria-hidden
            className="absolute -inset-3 -z-10 rotate-3 rounded-2xl bg-sunny-200/70"
          />
          <span
            aria-hidden
            className="absolute -inset-3 -z-10 -rotate-2 rounded-2xl bg-teal-100/80"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-4 border-background shadow-glow-primary lg:aspect-[5/6]">
            <Image
              src={placeholderImages.hero.src}
              alt={t("imageAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 90vw"
              className="object-cover"
            />
          </div>

          <HeroBadge
            icon={<LayersIcon aria-hidden />}
            className="top-6 -left-4 sm:-left-8"
            tone="primary"
          >
            {t("badgeLevels")}
          </HeroBadge>
          <HeroBadge
            icon={<MapPinIcon aria-hidden />}
            className="-right-3 bottom-24 [animation-delay:-2s] sm:-right-8"
            tone="partner"
          >
            {t("badgeNearby")}
          </HeroBadge>
          <HeroBadge
            icon={<SparklesIcon aria-hidden />}
            className="-bottom-5 left-8 [animation-delay:-4s]"
            tone="highlight"
          >
            {t("badgeSmallClass")}
          </HeroBadge>
        </div>
      </div>
    </section>
  );
}

const badgeTones = {
  primary: "bg-primary-soft text-primary",
  partner: "bg-partner-soft text-partner",
  highlight: "bg-highlight-soft text-level-kindy-strong",
} as const;

/** Floating glass badge over the hero photo; decorative drift is disabled for reduced motion. */
function HeroBadge({
  icon,
  tone,
  className,
  children,
}: {
  icon: ReactNode;
  tone: keyof typeof badgeTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "absolute inline-flex animate-float items-center gap-2.5 rounded-2xl border border-border/60 surface-glass py-2 pr-4 pl-2 text-label text-foreground shadow-lg motion-reduce:animate-none",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl [&_svg]:size-5",
          badgeTones[tone],
        )}
      >
        {icon}
      </span>
      {children}
    </p>
  );
}

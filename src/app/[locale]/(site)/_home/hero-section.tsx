import { ArrowRightIcon, BookOpenIcon, LayersIcon, MapPinIcon, UsersRoundIcon } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Button } from "@/components/ui/button";
import { placeholderImages } from "@/config/placeholder-images";
import { levelTheme } from "@/features/programs/level-theme";
import type { Level } from "@/features/programs/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Delay between hero entrance steps (matches the stagger rhythm in motion/tokens.ts). */
const ENTER_STEP_MS = 90;

/** Inline delay for the CSS `animate-rise-in` entrance of the n-th hero element. */
const enterDelay = (step: number): CSSProperties => ({
  animationDelay: `${step * ENTER_STEP_MS}ms`,
});

/**
 * Home hero (DESIGN.md § 5.2): dual path (parents → find a unit, partners → partnership),
 * age chips that jump to and highlight the matching level card (CSS `:target`, no JS).
 * The headline and photo render immediately — they are the LCP, so they are never faded in: the
 * other hero elements rise in with CSS on load, and the photo only settles from a slight zoom.
 * Decorative layers drift with scroll (`parallax-*`, CSS scroll-driven, off for reduced motion).
 */
export async function HeroSection({ levels }: { levels: Level[] }) {
  const t = await getTranslations("Home.hero");

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-x-clip">
      <DecorBlob tone="highlight" className="parallax-strong top-16 -right-24 size-80" />
      <DecorBlob tone="primary" className="parallax-soft -bottom-24 -left-32 size-96" />
      <Doodle
        shape="squiggle"
        tone="partner"
        className="parallax-soft top-10 left-[46%] hidden w-16 lg:block"
      />
      <Doodle
        shape="ring"
        tone="highlight"
        className="parallax-strong bottom-28 left-[8%] size-8"
      />
      <Doodle
        shape="plus"
        tone="primary"
        className="top-24 right-[6%] hidden size-7 animate-float md:block"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-dots [mask-image:radial-gradient(70%_70%_at_70%_40%,black,transparent)] opacity-70 lg:block"
      />

      <div className="mx-auto grid w-full max-w-page items-center gap-12 px-5 pt-8 pb-24 md:px-8 md:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-14 lg:pb-32">
        <div className="flex flex-col gap-6">
          {/* Two short segments instead of one long line, so it never wraps on phones. */}
          <p
            style={enterDelay(0)}
            className="inline-flex w-fit animate-rise-in items-center gap-2 rounded-full border border-border/70 bg-background/80 py-1 pr-1 pl-3 text-overline whitespace-nowrap text-partner uppercase shadow-sm backdrop-blur max-sm:tracking-wide"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-partner" />
            {t("overline")}
            <span className="rounded-full bg-partner-soft px-2.5 py-1 tracking-normal text-partner-strong normal-case">
              {t("ageBadge")}
            </span>
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

          <p
            style={enterDelay(1)}
            className="max-w-xl animate-lift-in text-body-lg text-muted-foreground"
          >
            {t("lead")}
          </p>

          <div
            style={enterDelay(2)}
            className="flex animate-rise-in flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button asChild size="lg" pop>
              <Link href="/cek-unit">
                <MapPinIcon aria-hidden />
                {t("primaryCta")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" pop>
              <Link href="/program">
                <BookOpenIcon aria-hidden />
                {t("secondaryCta")}
              </Link>
            </Button>
          </div>

          <div
            style={enterDelay(3)}
            className="grid animate-rise-in grid-cols-3 items-center gap-2 sm:flex sm:flex-wrap"
          >
            <span className="col-span-3 text-label text-muted-foreground sm:col-span-1">
              {t("agePrompt")}
            </span>
            {levels.map((level) => (
              <a
                key={level.slug}
                href={`#level-${level.slug}`}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-label text-foreground shadow-sm",
                  "transition-[transform,border-color,background-color,box-shadow] duration-(--duration-fast) ease-out hover:-translate-y-0.5 hover:shadow-md",
                  levelTheme[level.slug].chip,
                )}
              >
                {t("ageOption", { min: level.ageMin, max: level.ageMax })}
                {/* Extra context for screen readers; the name still starts with the visible text. */}
                <span className="sr-only"> — {t("ageOptionHint", { level: level.name })}</span>
              </a>
            ))}
          </div>

          <p style={enterDelay(4)} className="animate-rise-in text-body-sm text-muted-foreground">
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
              className="animate-settle object-cover"
            />
          </div>

          <HeroBadge
            icon={<LayersIcon aria-hidden />}
            step={5}
            className="top-6 -left-4 sm:-left-8"
            tone="primary"
          >
            {t("badgeLevels")}
          </HeroBadge>
          <HeroBadge
            icon={<MapPinIcon aria-hidden />}
            step={6}
            floatClassName="[animation-delay:-2.5s]"
            className="-right-3 bottom-24 sm:-right-8"
            tone="partner"
          >
            {t("badgeNearby")}
          </HeroBadge>
          <HeroBadge
            icon={<UsersRoundIcon aria-hidden />}
            step={7}
            floatClassName="[animation-delay:-5s]"
            className="-bottom-5 left-8"
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

/**
 * Glass badge over the hero photo: rises in after the copy, then drifts slowly. The two motions
 * live on separate elements because each element can run only one `animation` shorthand.
 */
function HeroBadge({
  icon,
  tone,
  step,
  className,
  floatClassName,
  children,
}: {
  icon: ReactNode;
  tone: keyof typeof badgeTones;
  step: number;
  className?: string;
  floatClassName?: string;
  children: ReactNode;
}) {
  return (
    <p style={enterDelay(step)} className={cn("absolute animate-rise-in", className)}>
      <span
        className={cn(
          "inline-flex animate-float items-center gap-2.5 rounded-2xl border border-border/60 surface-glass py-2 pr-4 pl-2 text-label text-foreground shadow-lg motion-reduce:animate-none",
          floatClassName,
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
      </span>
    </p>
  );
}

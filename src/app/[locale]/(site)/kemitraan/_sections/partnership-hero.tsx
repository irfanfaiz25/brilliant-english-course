import { ClipboardPenIcon, HomeIcon, MapPinnedIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { CountUp } from "@/components/motion/count-up";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Button } from "@/components/ui/button";
import { limits } from "@/config/limits";
import { placeholderImages } from "@/config/placeholder-images";
import type { NetworkStats } from "@/features/units/schema";

/**
 * Partner landing header: the promise, the two partner actions (check quota → apply) and the
 * numbers that make it credible. Photo with a floating badge from `lg`, stats card below the copy.
 */
export async function PartnershipHero({ stats }: { stats: NetworkStats }) {
  const t = await getTranslations("Partnership.hero");
  const tNav = await getTranslations("Nav");
  // Two balanced label lines on phones, one line from `md` (same rule as the home stats).
  const lineBreak = () => <br className="md:hidden" />;

  const items = [
    {
      key: "units",
      value: <CountUp value={stats.activeUnits} suffix="+" hiddenOnLoad />,
      label: t.rich("units", { br: lineBreak }),
    },
    {
      key: "cities",
      value: <CountUp value={stats.cities} hiddenOnLoad />,
      label: t.rich("cities", { br: lineBreak }),
    },
    {
      key: "quota",
      value: t("quotaValue", { max: limits.unitsPerVillage }),
      label: t.rich("quota", { br: lineBreak }),
    },
  ];

  return (
    <section aria-labelledby="partnership-title" className="relative isolate overflow-x-clip">
      <DecorBlob tone="partner" className="parallax-strong -top-10 -right-24 size-96" />
      <DecorBlob tone="highlight" className="parallax-soft top-1/2 -left-32 size-80" />
      <Doodle
        shape="squiggle"
        tone="primary"
        className="parallax-soft top-20 left-[46%] hidden w-16 lg:block"
      />
      <Doodle shape="ring" tone="partner" className="parallax-strong right-[8%] bottom-10 size-8" />

      <div className="mx-auto grid w-full max-w-page items-center gap-10 px-5 pt-8 pb-12 md:px-8 md:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pb-16">
        <div className="flex min-w-0 flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: tNav("partnership"), href: "/kemitraan" },
            ]}
            className="animate-rise-in"
          />
          <p className="inline-flex animate-rise-in items-center gap-2 text-overline text-partner uppercase [animation-delay:90ms]">
            <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
            {t("overline")}
          </p>
          <h1 id="partnership-title" className="text-display text-foreground">
            {t("title")}
          </h1>
          <p className="max-w-2xl animate-lift-in text-body-lg text-muted-foreground [animation-delay:180ms]">
            {t("lead")}
          </p>
          <div className="flex animate-rise-in flex-col gap-3 pt-1 [animation-delay:270ms] sm:flex-row">
            <Button asChild size="lg" variant="partner" pop>
              <a href="#kuota">
                <MapPinnedIcon aria-hidden />
                {t("primaryCta")}
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" pop>
              <a href="#daftar">
                <ClipboardPenIcon aria-hidden />
                {t("secondaryCta")}
              </a>
            </Button>
          </div>

          <dl
            aria-label={t("statsLabel")}
            className="mt-3 grid animate-rise-in grid-cols-3 divide-x divide-border/70 rounded-2xl border border-border/60 bg-card py-4 shadow-glow-partner [animation-delay:360ms] md:py-5"
          >
            {items.map((item) => (
              <div key={item.key} className="flex flex-col items-center gap-1 px-2 text-center">
                <dd className="order-first text-h4 whitespace-nowrap text-partner md:text-h3">
                  {item.value}
                </dd>
                <dt className="text-caption leading-snug text-muted-foreground md:text-body-sm">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto hidden w-full max-w-md animate-settle lg:block">
          <span
            aria-hidden
            className="absolute -inset-4 -z-10 rotate-3 rounded-3xl bg-partner-soft"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border-4 border-background shadow-lg">
            <Image
              src={placeholderImages.activityStorytelling.src}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 28rem, 0px"
              className="object-cover"
            />
          </div>
          <p className="absolute -bottom-5 -left-8 flex animate-float items-center gap-3 rounded-2xl bg-background px-5 py-3 text-label text-foreground shadow-lg motion-reduce:animate-none">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-partner-soft text-partner">
              <HomeIcon aria-hidden className="size-5" />
            </span>
            {t("imageBadge")}
          </p>
        </div>
      </div>
    </section>
  );
}

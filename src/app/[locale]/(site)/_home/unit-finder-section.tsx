import { ArrowRightIcon, LocateFixedIcon, SearchIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/input-styles";
import { UnitCard } from "@/features/units/components/unit-card";
import type { UnitSummary } from "@/features/units/schema";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Compact unit finder: a plain GET search form to the Cek Unit page (works without JS) and a
 * preview of active units. The full region cascade lives on the Cek Unit page (Phase 5c).
 */
export async function UnitFinderSection({ units }: { units: UnitSummary[] }) {
  const t = await getTranslations("Home.unitFinder");
  const locale = (await getLocale()) as Locale;
  const searchAction = getPathname({ href: "/cek-unit", locale });

  return (
    <Section id="cek-unit" aria-labelledby="unit-finder-title">
      <DecorBlob tone="primary" className="parallax-soft top-10 -right-32 size-96 opacity-60" />
      <Doodle
        shape="ring"
        tone="primary"
        className="parallax-strong top-20 left-[4%] hidden size-9 lg:block"
      />
      <Doodle
        shape="dots"
        tone="highlight"
        className="parallax-soft bottom-16 left-[38%] size-14 opacity-80"
      />

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="flex flex-col gap-8 lg:sticky lg:top-(--header-offset)">
          <SectionHeader
            id="unit-finder-title"
            overline={t("overline")}
            title={t("title")}
            lead={t("lead")}
          />

          <Reveal className="flex flex-col gap-4">
            <form
              action={searchAction}
              method="get"
              role="search"
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-glow-primary sm:flex-row"
            >
              <label htmlFor="unit-search" className="sr-only">
                {t("searchLabel")}
              </label>
              <div className="relative flex-1">
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="unit-search"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder={t("searchPlaceholder")}
                  className={cn(fieldControlClass, "h-12 border-transparent bg-surface pl-12")}
                />
              </div>
              <Button type="submit" className="h-12">
                {t("submit")}
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={{ pathname: "/cek-unit", query: { dekat: "1" } }}
                className="inline-flex items-center gap-2 text-label text-primary underline-offset-4 hover:underline"
              >
                <LocateFixedIcon aria-hidden className="size-4" />
                {t("useLocation")}
              </Link>
              <p className="text-caption text-muted-foreground">{t("note")}</p>
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-overline text-muted-foreground uppercase">{t("previewTitle")}</p>
          <Stagger as="ul" className="flex flex-col gap-4">
            {units.map((unit) => (
              <StaggerItem key={unit.code} as="li">
                <UnitCard unit={unit} />
              </StaggerItem>
            ))}
          </Stagger>
          <Link
            href="/cek-unit"
            className="group inline-flex items-center gap-1.5 self-start text-label text-primary underline-offset-4 hover:underline"
          >
            {t("seeAll")}
            <ArrowRightIcon
              aria-hidden
              className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </Section>
  );
}

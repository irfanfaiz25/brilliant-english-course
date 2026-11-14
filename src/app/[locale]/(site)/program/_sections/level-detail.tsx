import {
  BookOpenIcon,
  CalendarDaysIcon,
  CheckIcon,
  MapPinIcon,
  UsersRoundIcon,
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { levelTheme } from "@/features/programs/level-theme";
import type { Level } from "@/features/programs/schema";
import { getContactSettings } from "@/features/settings/queries";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { courseJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type LevelDetailProps = {
  level: Level;
  /** Alternates the photo side on desktop so the page reads as a rhythm. */
  reversed?: boolean;
  /** The first level sits in the first viewport, so it renders without entrance animations. */
  aboveFold?: boolean;
};

/**
 * One program level: what it is, what children learn, class facts, the two parent actions, and
 * `Course` structured data. `id` = level slug, the target of `/program#<slug>` links and the tabs.
 */
export async function LevelDetail({
  level,
  reversed = false,
  aboveFold = false,
}: LevelDetailProps) {
  const t = await getTranslations("Program.level");
  const tWhatsApp = await getTranslations("WhatsApp");
  const contact = await getContactSettings();
  const locale = (await getLocale()) as Locale;
  const theme = levelTheme[level.slug];
  const headingId = `${level.slug}-title`;

  return (
    // Extra scroll margin clears the sticky level tabs under the header.
    <Section id={level.slug} aria-labelledby={headingId} className="scroll-mt-16">
      <JsonLd
        data={courseJsonLd({
          name: `${level.name} — ${level.tagline}`,
          description: level.description,
          url: absoluteUrl(`${getPathname({ href: "/program", locale })}#${level.slug}`),
          teaches: level.curriculum,
          minAge: level.ageMin,
          maxAge: level.ageMax,
          inLanguage: "en",
          provider: { name: siteConfig.name, url: absoluteUrl(getPathname({ href: "/", locale })) },
        })}
      />
      <DecorBlob
        tone={theme.decor}
        className={cn(
          "parallax-soft top-10 size-[28rem] opacity-60",
          reversed ? "-left-40" : "-right-40",
        )}
      />
      <Doodle
        shape="dots"
        tone={theme.decor}
        className={cn(
          "parallax-strong top-24 hidden size-14 opacity-70 md:block",
          reversed ? "right-[6%]" : "left-[4%]",
        )}
      />

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn("flex flex-col gap-6", reversed && "lg:order-2")}>
          <Reveal immediate={aboveFold} className="flex flex-col gap-3">
            <Badge variant={theme.badge} className="text-label">
              {t("ages", { min: level.ageMin, max: level.ageMax })}
            </Badge>
            <h2 id={headingId} className="text-h2 text-foreground">
              <span className={theme.accent}>{level.name}</span> — {level.tagline}
            </h2>
            <p className="text-body-lg text-muted-foreground">{level.description}</p>
          </Reveal>

          <div className="flex flex-col gap-3">
            <p className="text-overline text-muted-foreground uppercase">{t("learnTitle")}</p>
            <Stagger as="ul" immediate={aboveFold} className="grid gap-2.5 sm:grid-cols-2">
              {level.curriculum.map((topic) => (
                <StaggerItem
                  key={topic}
                  as="li"
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 text-body-sm text-foreground shadow-sm"
                >
                  <span
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                      theme.soft,
                      theme.accent,
                    )}
                  >
                    <CheckIcon aria-hidden className="size-3.5" />
                  </span>
                  {topic}
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <Reveal as="div" immediate={aboveFold} className="flex flex-col gap-6">
            <ul className="flex flex-wrap gap-2">
              <Fact icon={<CalendarDaysIcon aria-hidden />}>
                {t("sessions", { count: level.sessionsPerWeek })}
              </Fact>
              <Fact icon={<UsersRoundIcon aria-hidden />}>
                {t("classSize", { count: level.maxStudentsPerClass })}
              </Fact>
              <Fact icon={<BookOpenIcon aria-hidden />}>{t("materials")}</Fact>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" pop>
                <Link href="/cek-unit">
                  <MapPinIcon aria-hidden />
                  {t("findUnit")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" pop>
                <a
                  href={buildWhatsAppUrl(
                    contact.whatsapp,
                    tWhatsApp("level", { level: level.name }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BrandIcon name="whatsapp" className="text-whatsapp" />
                  {t("askWhatsApp")}
                </a>
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal
          immediate={aboveFold}
          className={cn("relative mx-auto w-full max-w-md lg:max-w-none", reversed && "lg:order-1")}
        >
          <span
            aria-hidden
            className={cn(
              "parallax-soft absolute -inset-3 -z-10 rounded-3xl",
              reversed ? "-rotate-3" : "rotate-3",
              theme.frame,
            )}
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-background shadow-lg">
            <Image
              src={level.image.src}
              alt={level.image.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover transition-transform duration-(--duration-slow) ease-out hover:scale-105"
            />
          </div>
          <p
            className={cn(
              "absolute -bottom-5 inline-flex animate-float items-center gap-2 rounded-2xl border border-border/60 surface-glass px-4 py-2.5 text-label text-foreground shadow-lg motion-reduce:animate-none",
              reversed ? "-right-3 sm:-right-6" : "-left-3 sm:-left-6",
            )}
          >
            <Badge variant={theme.badge}>{level.name}</Badge>
            {t("ages", { min: level.ageMin, max: level.ageMax })}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-body-sm text-foreground [&_svg]:size-4 [&_svg]:text-primary">
      {icon}
      {children}
    </li>
  );
}

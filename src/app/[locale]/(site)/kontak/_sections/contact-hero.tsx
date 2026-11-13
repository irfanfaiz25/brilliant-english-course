import { ClockIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";

/** Page header with the reply window, so visitors know when to expect an answer. */
export async function ContactHero({ hoursText }: { hoursText: string }) {
  const t = await getTranslations("Contact.hero");
  const tNav = await getTranslations("Nav");

  return (
    <section aria-labelledby="contact-title" className="relative isolate overflow-x-clip">
      <DecorBlob tone="primary" className="parallax-strong -top-10 -right-24 size-80" />
      <Doodle
        shape="squiggle"
        tone="partner"
        className="parallax-soft top-16 right-[20%] hidden w-16 md:block"
      />

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-5 pt-8 pb-6 md:px-8 md:pt-12 lg:pb-8">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("contact"), href: "/kontak" },
          ]}
          className="animate-rise-in"
        />
        <p className="inline-flex animate-rise-in items-center gap-2 text-overline text-partner uppercase [animation-delay:90ms]">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
          {t("overline")}
        </p>
        <h1 id="contact-title" className="text-h1 text-primary">
          {t("title")}
        </h1>
        <p className="max-w-3xl animate-rise-in text-body-lg text-muted-foreground [animation-delay:180ms]">
          {t("lead")}
        </p>
        <p className="inline-flex w-fit animate-rise-in items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-caption text-muted-foreground shadow-sm [animation-delay:270ms]">
          <ClockIcon aria-hidden className="size-3.5 shrink-0 text-primary" />
          {/* The label hides on phones so the pill stays on one line. */}
          <span className="max-sm:sr-only">{t("hoursLabel")} ·</span>
          <span className="whitespace-nowrap">{hoursText}</span>
        </p>
      </div>
    </section>
  );
}

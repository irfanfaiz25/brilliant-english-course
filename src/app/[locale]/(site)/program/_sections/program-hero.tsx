import { BookOpenCheckIcon, LayersIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";

/** Page header: breadcrumb, title and the two facts that frame the curriculum. */
export async function ProgramHero() {
  const t = await getTranslations("Program.hero");
  const tNav = await getTranslations("Nav");

  return (
    <section aria-labelledby="program-title" className="relative isolate overflow-x-clip">
      <DecorBlob tone="highlight" className="parallax-strong top-0 -right-24 size-80" />
      <Doodle
        shape="squiggle"
        tone="partner"
        className="parallax-soft top-16 right-[18%] hidden w-16 md:block"
      />
      <Doodle shape="ring" tone="primary" className="parallax-strong bottom-6 left-[6%] size-8" />

      <div className="mx-auto flex w-full max-w-page flex-col gap-5 px-5 pt-8 pb-10 md:px-8 md:pt-12 lg:pb-14">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("program"), href: "/program" },
          ]}
          className="animate-rise-in"
        />
        <p className="inline-flex animate-rise-in items-center gap-2 text-overline text-partner uppercase [animation-delay:90ms]">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
          {t("overline")}
        </p>
        <h1 id="program-title" className="text-display text-primary">
          {t("title")}
        </h1>
        <p className="max-w-3xl animate-rise-in text-body-lg text-muted-foreground [animation-delay:180ms]">
          {t("lead")}
        </p>
        <ul className="flex animate-rise-in flex-wrap gap-2 [animation-delay:270ms]">
          <li className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-label text-foreground shadow-sm">
            <LayersIcon aria-hidden className="size-4 text-primary" />
            {t("levelsCount")}
          </li>
          <li className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-label text-foreground shadow-sm">
            <BookOpenCheckIcon aria-hidden className="size-4 text-partner" />
            {t("sameCurriculum")}
          </li>
        </ul>
      </div>
    </section>
  );
}

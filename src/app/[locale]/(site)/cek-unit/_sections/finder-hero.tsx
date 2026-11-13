import { MapIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";

export async function FinderHero() {
  const t = await getTranslations("Finder.hero");
  const tNav = await getTranslations("Nav");

  return (
    <section aria-labelledby="finder-title" className="relative isolate overflow-x-clip">
      <DecorBlob tone="primary" className="parallax-strong -top-10 -right-24 size-80" />
      <Doodle
        shape="ring"
        tone="highlight"
        className="parallax-soft top-16 right-[22%] hidden size-9 md:block"
      />

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-5 pt-8 pb-6 md:px-8 md:pt-12 lg:pb-10">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("findUnit"), href: "/cek-unit" },
          ]}
          className="animate-rise-in"
        />
        <p className="inline-flex animate-rise-in items-center gap-2 text-overline text-partner uppercase [animation-delay:90ms]">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
          {t("overline")}
        </p>
        <h1 id="finder-title" className="text-h1 text-primary">
          {t("title")}
        </h1>
        <p className="max-w-3xl animate-rise-in text-body-lg text-muted-foreground [animation-delay:180ms]">
          {t("lead")}
        </p>
        <p className="inline-flex w-fit animate-rise-in items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-caption text-muted-foreground shadow-sm [animation-delay:270ms]">
          <MapIcon aria-hidden className="size-3.5 text-primary" />
          {t("note")}
        </p>
      </div>
    </section>
  );
}

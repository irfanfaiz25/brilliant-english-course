import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";

/** Blog header: breadcrumb, title and what readers will find here. */
export async function BlogHero() {
  const t = await getTranslations("Blog.hero");
  const tNav = await getTranslations("Nav");

  return (
    <section aria-labelledby="blog-title" className="relative isolate overflow-x-clip">
      <DecorBlob tone="highlight" className="parallax-strong -top-12 -right-24 size-80" />
      <Doodle
        shape="squiggle"
        tone="partner"
        className="parallax-soft top-16 right-[20%] hidden w-16 md:block"
      />
      <Doodle shape="dots" tone="primary" className="parallax-strong bottom-4 left-[4%] size-12" />

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-5 pt-8 pb-6 md:px-8 md:pt-12 lg:pb-8">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("blog"), href: "/blog" },
          ]}
          className="animate-rise-in"
        />
        <p className="inline-flex animate-rise-in items-center gap-2 text-overline text-partner uppercase [animation-delay:90ms]">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
          {t("overline")}
        </p>
        <h1 id="blog-title" className="text-h1 text-primary">
          {t("title")}
        </h1>
        <p className="max-w-3xl animate-rise-in text-body-lg text-muted-foreground [animation-delay:180ms]">
          {t("lead")}
        </p>
      </div>
    </section>
  );
}

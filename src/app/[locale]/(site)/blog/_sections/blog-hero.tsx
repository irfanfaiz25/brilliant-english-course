import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/site/page-hero";

/** Blog header: breadcrumb, title and what readers will find here. */
export async function BlogHero() {
  const t = await getTranslations("Blog.hero");
  const tNav = await getTranslations("Nav");

  return (
    <PageHero
      id="blog-title"
      accent="highlight"
      breadcrumbs={[
        { label: tNav("home"), href: "/" },
        { label: tNav("blog"), href: "/blog" },
      ]}
      overline={t("overline")}
      title={t("title")}
      lead={t("lead")}
    />
  );
}

import { NewspaperIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/blog/components/post-card";
import { parseBlogParams } from "@/features/blog/index-params";
import { getPostSummaries } from "@/features/blog/queries";
import { paginatePosts } from "@/features/blog/service";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { BlogPagination } from "./blog-pagination";
import { CategoryNav } from "./category-nav";

/** Delay between cards rising in (CSS), capped so long lists don't drag. */
const CARD_STAGGER_MS = 60;
const MAX_STAGGERED_CARDS = 6;

type SearchParams = PageProps<"/[locale]/blog">["searchParams"];

/**
 * Category chips, the featured post (unfiltered page 1 only), the card grid and pagination —
 * all derived from `?kategori=&halaman=` on the server.
 */
export async function BlogListing({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Blog");
  const locale = (await getLocale()) as Locale;
  const params = parseBlogParams(await searchParams);
  const posts = await getPostSummaries(locale, params.category);
  const { featured, items, page, totalPages, total } = paginatePosts(posts, {
    page: params.page,
    featureFirst: !params.category,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CategoryNav active={params.category} />
        <p aria-live="polite" className="shrink-0 text-body-sm text-muted-foreground">
          {t("count", { count: total })}
        </p>
      </div>

      {total === 0 ? (
        <div className="flex animate-rise-in flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <NewspaperIcon aria-hidden className="size-7" />
          </span>
          <h2 className="text-h4 text-foreground">{t("empty.title")}</h2>
          <p className="max-w-md text-body text-muted-foreground">{t("empty.text")}</p>
          <Button asChild variant="secondary">
            <Link href="/blog">{t("empty.cta")}</Link>
          </Button>
        </div>
      ) : (
        <>
          {featured && (
            <section aria-label={t("latest")} className="animate-rise-in">
              <PostCard post={featured} featured headingLevel="h2" priority />
            </section>
          )}
          {items.length > 0 && (
            <ul
              aria-label={t("listLabel")}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            >
              {items.map((post, index) => (
                <li
                  key={post.id}
                  style={
                    {
                      animationDelay: `${Math.min(index, MAX_STAGGERED_CARDS) * CARD_STAGGER_MS}ms`,
                    } as CSSProperties
                  }
                  className="animate-rise-in"
                >
                  <PostCard post={post} headingLevel={featured ? "h3" : "h2"} />
                </li>
              ))}
            </ul>
          )}
          <BlogPagination page={page} totalPages={totalPages} category={params.category} />
        </>
      )}
    </div>
  );
}

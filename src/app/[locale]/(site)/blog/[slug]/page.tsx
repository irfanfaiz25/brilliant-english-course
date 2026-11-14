import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";

import { ScrollProgress } from "@/components/motion/scroll-progress";
import { PageCanvas } from "@/components/site/page-canvas";
import { siteConfig } from "@/config/site";
import { RichText } from "@/features/blog/components/rich-text";
import {
  findTranslatedSlug,
  getPostBySlug,
  getPostSlugs,
  getPostSummaries,
} from "@/features/blog/queries";
import { extractHeadings, relatedPosts } from "@/features/blog/service";
import { getPathname, permanentRedirect, redirect } from "@/i18n/navigation";
import { localeRegion, routing, type Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { localizedAlternates } from "@/lib/seo/alternates";
import { articleJsonLd, JsonLd } from "@/lib/seo/json-ld";

import { PostCta } from "./_sections/post-cta";
import { PostHeader } from "./_sections/post-header";
import { RelatedPosts } from "./_sections/related-posts";
import { ShareLinks } from "./_sections/share-links";
import { TableOfContents } from "./_sections/table-of-contents";

type Props = PageProps<"/[locale]/blog/[slug]">;

/** Prerender every post of each locale (the locale comes from the parent layout's params). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!hasLocale(routing.locales, params.locale)) return [];
  const slugs = await getPostSlugs(params.locale);
  return slugs.map((slug) => ({ slug }));
}

const postHref = (slug: string) => ({ pathname: "/blog/[slug]" as const, params: { slug } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const post = await getPostBySlug(locale, slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: localizedAlternates((target) => {
      const targetSlug = post.slugs[target];
      return targetSlug ? postHref(targetSlug) : null;
    }, locale),
    openGraph: {
      type: "article",
      siteName: siteConfig.name,
      locale: localeRegion[locale],
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: post.cover.src,
          width: post.cover.width,
          height: post.cover.height,
          alt: post.cover.alt,
        },
      ],
    },
  };
}

/**
 * Blog post (Phase 5e): header, cover, the article with a table of contents (collapsible on
 * phones, sticky beside the text on desktop), sharing, a next-step CTA and related posts.
 * A slug from the other language redirects to this language's slug (language switcher), or to
 * this language's blog index when the post is not written in it.
 */
export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const post = await getPostBySlug(locale, slug);
  if (!post) {
    const translated = await findTranslatedSlug(locale, slug);
    // Not written in this language (yet): the blog index of this language instead.
    if (translated === "untranslated") redirect({ href: "/blog", locale });
    if (translated) permanentRedirect({ href: postHref(translated), locale });
    notFound();
  }

  const t = await getTranslations("Blog.post");
  const format = await getFormatter();
  const headings = extractHeadings(post.content);
  const related = relatedPosts(await getPostSummaries(locale), post);
  const url = absoluteUrl(getPathname({ href: postHref(post.slug), locale: locale as Locale }));

  return (
    <>
      <ScrollProgress />
      <JsonLd
        data={articleJsonLd({
          headline: post.title,
          description: post.excerpt,
          url,
          image: absoluteUrl(post.cover.src),
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          inLanguage: localeRegion[locale].replace("_", "-"),
          author: post.author.name,
          publisher: { name: siteConfig.name, logo: absoluteUrl(siteConfig.logo.fallbackSrc) },
        })}
      />
      <PageCanvas>
        <article aria-labelledby="post-title">
          <PostHeader post={post} />

          <div className="mx-auto w-full max-w-page px-5 md:px-8">
            <div className="relative aspect-[16/9] animate-settle overflow-hidden rounded-3xl border-4 border-background bg-muted shadow-lg lg:aspect-[21/9]">
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                fill
                priority
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-1 gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
              <div className="flex min-w-0 flex-col gap-10">
                <div className="lg:hidden">
                  <TableOfContents headings={headings} label={t("toc")} variant="inline" />
                </div>
                <RichText doc={post.content} className="max-w-[68ch]" />
                <div className="flex max-w-[68ch] flex-col gap-6 border-t border-border/70 pt-6">
                  {post.updatedAt && (
                    <p className="text-caption text-muted-foreground">
                      {t("updated", {
                        date: format.dateTime(new Date(post.updatedAt), {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        }),
                      })}
                    </p>
                  )}
                  <ShareLinks post={post} className="lg:hidden" />
                  <PostCta category={post.category} />
                </div>
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-28 flex flex-col gap-8">
                  <TableOfContents headings={headings} label={t("toc")} variant="sidebar" />
                  <ShareLinks post={post} />
                </div>
              </aside>
            </div>
          </div>
        </article>

        <RelatedPosts posts={related} />
      </PageCanvas>
    </>
  );
}

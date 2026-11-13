import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { PostSummary } from "../schema";
import { CategoryBadge } from "./category-badge";
import { PostMeta } from "./post-meta";

/**
 * Post teaser. The title link stretches over the whole card (one tab stop, one link for screen
 * readers). `featured` is the wide hero card of the blog index.
 */
export async function PostCard({
  post,
  featured = false,
  headingLevel = "h3",
  priority = false,
}: {
  post: PostSummary;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
}) {
  const t = await getTranslations("Blog");
  const Heading = headingLevel;

  return (
    <article
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out focus-within:shadow-lg hover:-translate-y-1 hover:shadow-lg",
        featured && "lg:grid lg:grid-cols-[7fr_5fr]",
      )}
    >
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden bg-muted",
          featured && "lg:aspect-auto lg:min-h-96",
        )}
      >
        <Image
          src={post.cover.src}
          alt={post.cover.alt}
          fill
          priority={priority}
          sizes={
            featured
              ? "(min-width: 1024px) 50vw, 100vw"
              : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          }
          className="object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
        />
        <CategoryBadge
          category={post.category}
          label={t(`categories.${post.category}`)}
          className="absolute top-4 left-4 shadow-sm"
        />
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-5 sm:p-6",
          featured && "lg:justify-center lg:gap-4 lg:p-10",
        )}
      >
        <PostMeta post={post} />
        <Heading
          className={cn(
            "text-foreground transition-colors duration-(--duration-fast) group-hover:text-primary",
            featured ? "text-h3 lg:text-h2" : "line-clamp-2 text-h5",
          )}
        >
          <Link
            href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
            className="rounded-sm after:absolute after:inset-0 after:z-10 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {post.title}
          </Link>
        </Heading>
        <p
          className={cn(
            "text-body-sm text-muted-foreground",
            featured ? "lg:text-body" : "line-clamp-3",
          )}
        >
          {post.excerpt}
        </p>
        <span
          aria-hidden
          className="mt-auto inline-flex items-center gap-1.5 pt-2 text-label text-primary"
        >
          {t("readMore")}
          <ArrowRightIcon className="size-4 transition-transform duration-(--duration-base) ease-out group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

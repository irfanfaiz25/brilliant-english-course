import { getTranslations } from "next-intl/server";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { CategoryBadge } from "@/features/blog/components/category-badge";
import { PostMeta } from "@/features/blog/components/post-meta";
import type { Post } from "@/features/blog/schema";

/** Article header: breadcrumb, category, title, lead, author and meta. */
export async function PostHeader({ post }: { post: Post }) {
  const t = await getTranslations("Blog");
  const tNav = await getTranslations("Nav");
  const initials = post.author.name
    .split(" ")
    .filter((word) => /^[A-Z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <header className="relative isolate overflow-x-clip">
      <DecorBlob tone="highlight" className="parallax-strong -top-16 -right-24 size-80" />
      <Doodle
        shape="ring"
        tone="partner"
        className="parallax-soft top-20 right-[14%] hidden size-9 md:block"
      />

      <div className="mx-auto flex w-full max-w-page flex-col gap-5 px-5 pt-8 pb-8 md:px-8 md:pt-12 lg:pb-10">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("blog"), href: "/blog" },
            { label: post.title, href: { pathname: "/blog/[slug]", params: { slug: post.slug } } },
          ]}
          className="animate-rise-in [&_li:last-child]:max-w-[16rem] sm:[&_li:last-child]:max-w-md [&_li:last-child_a]:truncate"
        />
        <div className="flex max-w-4xl flex-col gap-4">
          <CategoryBadge
            category={post.category}
            label={t(`categories.${post.category}`)}
            className="animate-rise-in [animation-delay:90ms]"
          />
          <h1 id="post-title" className="text-h1 text-foreground">
            {post.title}
          </h1>
          <p className="animate-rise-in text-body-lg text-muted-foreground [animation-delay:180ms]">
            {post.excerpt}
          </p>
          <div className="flex animate-rise-in flex-wrap items-center gap-x-4 gap-y-2 pt-1 [animation-delay:270ms]">
            <span className="inline-flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-label text-primary"
              >
                {initials}
              </span>
              <span className="flex flex-col">
                <span className="text-label text-foreground">{post.author.name}</span>
                <span className="text-caption text-muted-foreground">{post.author.role}</span>
              </span>
            </span>
            <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />
            <PostMeta post={post} />
          </div>
        </div>
      </div>
    </header>
  );
}

import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { PostCard } from "@/features/blog/components/post-card";
import type { PostSummary } from "@/features/blog/schema";

/** "Read next": same category first, then the latest posts. */
export async function RelatedPosts({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;
  const t = await getTranslations("Blog.post.related");

  return (
    <Section aria-labelledby="related-title" spacing="compact">
      <SectionHeader id="related-title" overline={t("overline")} title={t("title")} />
      <Stagger as="ul" className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-6">
        {posts.map((post) => (
          <StaggerItem key={post.id} as="li" className="h-full">
            <PostCard post={post} />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

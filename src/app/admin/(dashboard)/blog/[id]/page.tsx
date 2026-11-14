import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LastSaved } from "@/components/admin/last-saved";
import { DeleteButton } from "@/components/admin/row-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { deletePostAction } from "@/features/blog/actions";
import { postCategoryLabels } from "@/features/blog/admin-labels";
import { getPostForEdit } from "@/features/blog/admin-queries";
import { PostForm } from "@/features/blog/components/post-form";
import { getMediaOptions } from "@/features/media/admin-queries";
import { requirePermission } from "@/features/users/session";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.blog") };
}

/** Edit an article (Phase 4e). The id is read inside the boundary: it is request data. */
export default function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  return (
    <Suspense fallback={<Skeleton aria-hidden className="h-[40rem] rounded-2xl" />}>
      <EditPost params={params} />
    </Suspense>
  );
}

async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be a post (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission("update", "blog", `${adminRoutes.blog}/${id}`);
  const canUseLibrary = can(user, "read", "media");
  const [t, post, mediaOptions, categoryLabels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminBlog" }),
    getPostForEdit(user, id),
    canUseLibrary ? getMediaOptions(user) : [],
    postCategoryLabels(),
  ]);
  if (!post) notFound();
  const title = post.values.texts.id.title;
  const siteHrefs = post.live
    ? Object.fromEntries(
        (Object.entries(post.slugs) as [Locale, string][]).map(([locale, slug]) => [
          locale,
          getPathname({ href: { pathname: "/blog/[slug]", params: { slug } }, locale }),
        ]),
      )
    : {};

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["blog"]}
        title={title}
        description={<LastSaved meta={{ updatedAt: post.updatedAt, updatedBy: null }} />}
        actions={
          can(user, "delete", "blog") && (
            <DeleteButton
              action={deletePostAction}
              input={{ id }}
              label={t("delete.label")}
              title={t("delete.title", { title })}
              description={t("delete.body")}
              confirmLabel={t("delete.confirm")}
              successMessage={t("delete.deleted")}
              redirectTo={adminRoutes.blog}
              showLabel
            />
          )
        }
      />
      <PostForm
        key={post.updatedAt.toISOString()}
        id={id}
        defaultValues={post.values}
        categoryLabels={categoryLabels}
        mediaOptions={mediaOptions}
        canUseLibrary={canUseLibrary}
        canUploadMedia={can(user, "create", "media")}
        canPublish={can(user, "publish", "blog")}
        siteHrefs={siteHrefs}
      />
    </>
  );
}

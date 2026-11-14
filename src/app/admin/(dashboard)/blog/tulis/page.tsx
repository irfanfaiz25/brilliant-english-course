import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { postCategoryLabels } from "@/features/blog/admin-labels";
import { PostForm } from "@/features/blog/components/post-form";
import { emptyPostText, type PostFormInput } from "@/features/blog/schema";
import { getMediaOptions } from "@/features/media/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminBlog" });
  return { title: t("createTitle") };
}

/** Write an article (Phase 4e); it starts as a draft. */
export default async function NewPostPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminBlog" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={["blog"]}
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[40rem] rounded-2xl" />}>
        <NewPost />
      </Suspense>
    </>
  );
}

async function NewPost() {
  const user = await requirePermission("create", "blog", adminRoutes.newPost);
  const canUseLibrary = can(user, "read", "media");
  const [mediaOptions, categoryLabels] = await Promise.all([
    canUseLibrary ? getMediaOptions(user) : [],
    postCategoryLabels(),
  ]);
  const defaultValues: PostFormInput = {
    category: "tips-belajar",
    coverImageId: "",
    authorName: user.name,
    authorRole: "",
    status: "draft",
    publishedAt: "",
    texts: { id: emptyPostText(), en: emptyPostText() },
  };
  return (
    <PostForm
      defaultValues={defaultValues}
      categoryLabels={categoryLabels}
      mediaOptions={mediaOptions}
      canUseLibrary={canUseLibrary}
      canUploadMedia={can(user, "create", "media")}
      canPublish={can(user, "publish", "blog")}
    />
  );
}

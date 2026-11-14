import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { firstParam } from "@/components/admin/list-href";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { TestimonialForm } from "@/features/testimonials/components/testimonial-form";
import { testimonialAudiences, type TestimonialFormInput } from "@/features/testimonials/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminTestimonials" });
  return { title: t("createTitle") };
}

/** Add a testimonial (Phase 4f); `?audience=` preselects the group the list was showing. */
export default async function NewTestimonialPage({
  searchParams,
}: PageProps<"/admin/testimoni/baru">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminTestimonials" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={["testimonials"]}
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[32rem] rounded-2xl" />}>
        <NewTestimonial searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewTestimonial({
  searchParams,
}: {
  searchParams: PageProps<"/admin/testimoni/baru">["searchParams"];
}) {
  const user = await requirePermission("create", "testimonials", adminRoutes.newTestimonial);
  const requested = firstParam((await searchParams).audience);
  const emptyText = { quote: "", role: "" };
  const values: TestimonialFormInput = {
    audience: testimonialAudiences.find((audience) => audience === requested) ?? "parent",
    authorName: "",
    rating: 5,
    isPublished: true,
    texts: { id: emptyText, en: emptyText },
  };
  return (
    <TestimonialForm defaultValues={values} canPublish={can(user, "publish", "testimonials")} />
  );
}
